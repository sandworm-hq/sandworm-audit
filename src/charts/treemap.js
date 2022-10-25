const D3Node = require('d3-node');
const addTooltips = require('./tooltip');
const {
  getModuleName,
  groupByDepth,
  getAncestors,
  getUid,
  humanFileSize,
  addSandwormLogo,
  addVulnerabilities,
} = require('./utils');

const d3n = new D3Node();
const {d3} = d3n;

const processData = (node) => {
  const dependencies = Object.values(node.dependencies || {}).map(processData);

  return {
    ...node,
    size: dependencies.length > 0 ? 0 : node.size,
    children:
      dependencies.length > 0
        ? [
            ...dependencies,
            {
              ...node,
              dependencies: undefined,
              children: [],
            },
          ]
        : [],
  };
};

// Modified from the original source below
// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/treemap
function buildTreemap(
  data,
  {
    tile = d3.treemapBinary, // treemap strategy
    width = 1000, // outer width, in pixels
    vulnerabilities = {},
    maxDepth = Infinity,
  } = {},
) {
  const moduleCallCounts = [];
  const getModuleCallCount = (d) => {
    if (d.data.size === 0) {
      return 0;
    }
    const moduleName = getModuleName(d);
    const currentCallCount = moduleCallCounts[moduleName] || 0;
    moduleCallCounts[moduleName] = currentCallCount + 1;
    return currentCallCount;
  };

  const root = d3.hierarchy(processData(data));

  const color = d3.scaleSequential([0, root.height], d3.interpolateBrBG);
  const nodeColor = (d) => {
    const vulnerability = vulnerabilities[d.data.name];
    if (vulnerability) {
      if (vulnerability.via[0].source) {
        return 'red';
      }
      return 'purple';
    }
    return getModuleCallCount(d) > 0 ? `url(#p-dots-0) ${color(d.height)}` : color(d.height);
  };
  const nodeStroke = (d) => {
    if (vulnerabilities[d.data.name]) {
      return 'red';
    }
    return undefined;
  };
  const nodeFillOpacity = (d) => {
    const vulnerability = vulnerabilities[d.data.name];
    if (vulnerability && vulnerability.via[0].source) {
      return 1;
    }
    return getModuleCallCount(d) > 1 ? 0.2 : 0.4;
  };

  // Compute the values of internal nodes by aggregating from the leaves.
  root.sum((d) => Math.max(0, d.size));
  // Sort the leaves (typically by descending value for a pleasing layout).
  root.sort((a, b) => d3.descending(a.value, b.value));

  d3
    .treemap()
    .tile(tile)
    .size([width, width])
    .paddingInner(1)
    .paddingTop(19)
    .paddingRight(3)
    .paddingBottom(3)
    .paddingLeft(3)
    .round(true)(root);

  const groupedData = groupByDepth(root, maxDepth);

  const svg = d3n
    .createSVG(width, width + 40)
    .attr('viewBox', [0, -40, width, width + 40])
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10);

  svg
    .append('defs')
    .append('pattern')
    .attr('id', 'p-dots-0')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 10)
    .attr('height', 10)
    .append('image')
    .attr(
      'xlink:href',
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSJ3aGl0ZSIgLz4KICA8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iYmxhY2siLz4KPC9zdmc+',
    )
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 10)
    .attr('height', 10);

  addSandwormLogo(svg, 0, -40, width);

  const node = svg
    .selectAll('g')
    .data(groupedData.filter((v) => !!v))
    .join('g')
    .attr('class', 'depth-group')
    .selectAll('g')
    .data((d) => d)
    .join('g')
    .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

  node
    .append('rect')
    .attr('fill', nodeColor)
    .attr('stroke', nodeStroke)
    .attr('fill-opacity', nodeFillOpacity)
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0);

  node.append('ancestry').attr('data', (d) => `${getAncestors(d).join('>')}`);

  addVulnerabilities(node, vulnerabilities);

  node
    .append('clipPath')
    // eslint-disable-next-line no-return-assign, no-param-reassign
    .attr('id', (d) => (d.clipUid = getUid('clip')).id)
    .append('rect')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0);

  node
    .append('text')
    .attr('clip-path', (d) => d.clipUid.href)
    .selectAll('tspan')
    .data((d) => `${d.data.name}\n${humanFileSize(d.value)}`.split(/\n/g))
    .join('tspan')
    .attr('fill-opacity', (d, i, D) => (i === D.length - 1 ? 0.7 : null))
    .text((d) => d);

  node
    .filter((d) => d.children)
    .selectAll('tspan')
    .attr('dx', 3)
    .attr('y', 13);

  node
    .filter((d) => !d.children)
    .selectAll('tspan')
    .attr('x', 3)
    .attr('y', (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`);

  addTooltips(svg);

  return d3n.svgString();
}

module.exports = buildTreemap;
