const D3Node = require('d3-node');
const addTooltips = require('./tooltip');
const {getModuleName, addSandwormLogo, getAncestors, addVulnerabilities} = require('./utils');

const d3n = new D3Node();
const {d3} = d3n;

// Modified from the original source below
// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/tree
const buildTree = (
  data,
  {
    tree = d3.tree, // layout algorithm (typically d3.tree or d3.cluster)
    showVersions = false,
    width = 1000,
    vulnerabilities = {},
    maxDepth = Infinity,
  } = {},
) => {
  const processData = (node, depth) => {
    const dependencies =
      depth >= maxDepth
        ? []
        : Object.values(node.dependencies || {}).map((n) => processData(n, depth + 1));

    return {
      ...node,
      children: dependencies,
    };
  };

  const root = d3.hierarchy(processData(data, 0));

  // Construct an ordinal color scale
  const color = d3.scaleOrdinal(
    new Set([getModuleName(root), (root.children || []).map((d) => getModuleName(d))]),
    d3.schemeTableau10,
  );
  const nodeColor = (d) => color(getModuleName(d.ancestors().reverse()[1] || d));
  const textColor = (d) => {
    const vulnerability = vulnerabilities[d.data.name];
    if (vulnerability) {
      if (!vulnerability[0].via) {
        return 'red';
      }
      return 'purple';
    }

    return '#333';
  };
  const textFontWeight = (d) => {
    const vulnerability = vulnerabilities[d.data.name];
    if (vulnerability) {
      return 'bold';
    }
    return 'normal';
  };
  const strokeColor = (d) => {
    const vulnerability = vulnerabilities[d.data.name];
    if (vulnerability) {
      return '#fff7c4';
    }

    return 'white';
  };
  const lineColor = (d1, d2) => {
    const vulnerability = vulnerabilities[d2.data.name];
    if (vulnerability) {
      return 'red';
    }
    return 'black';
  };

  // Compute the layout.
  const padding = 1;
  const dx = 10;
  const dy = width / (root.height + padding);
  tree().nodeSize([dx, dy])(root);

  // Center the tree.
  let x0 = Infinity;
  let x1 = -x0;
  root.each((d) => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  // Compute the default height.
  const height = x1 - x0 + dx * 2;
  const offsetX = Math.floor((-dy * padding) / 2);
  const offsetY = Math.floor(x0 - dx) - 50;

  const svg = d3n
    .createSVG(width, height + 60)
    .attr('viewBox', [offsetX, offsetY, width, height + 60])
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10);

  addSandwormLogo(svg, offsetX, offsetY, width);

  svg
    .append('g')
    .attr('id', 'path-group')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(root.links())
    .join('path')
    .attr(
      'd',
      d3
        .linkHorizontal()
        .x((d) => d.y)
        .y((d) => d.x),
    )
    .attr('stroke', ({source, target}) => lineColor(source, target));

  const node = svg
    .append('g')
    .attr('id', 'label-group')
    .selectAll('g')
    .data(root.descendants())
    .join('g')
    .attr('style', 'cursor: pointer')
    .attr('transform', (d) => `translate(${d.y},${d.x})`);

  node
    .append('circle')
    .attr('fill', nodeColor)
    .attr('stroke', '#999')
    .attr('stroke-width', 1)
    .attr('r', 3);

  node.append('ancestry').attr('data', (d) => getAncestors(d).join('>'));

  addVulnerabilities(node, vulnerabilities);

  node
    .append('text')
    .attr('dy', '0.32em')
    .attr('x', (d) => (d.children ? -6 : 6))
    .attr('font-weight', textFontWeight)
    .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
    .attr('paint-order', 'stroke')
    .attr('fill', textColor)
    .attr('stroke-width', 3)
    .attr('stroke', strokeColor)
    .text((d) => (showVersions ? getModuleName(d) : d.data.name));

  addTooltips(svg);

  return d3n.svgString();
};

module.exports = buildTree;
