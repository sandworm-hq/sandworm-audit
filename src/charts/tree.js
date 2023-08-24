const D3Node = require('d3-node');
const logger = require('../cli/logger');
const addTooltips = require('./tooltip');
const {
  getModuleName,
  addSandwormLogo,
  getAncestors,
  addIssues,
  processGraph,
  addLicenseData,
  getIssueLevel,
  getReportsForNode,
} = require('./utils');

// Modified from the original source below
// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/tree
const buildTree = (
  data,
  {
    tree,
    showVersions = false,
    width = 1000,
    issues = [],
    maxDepth = Infinity,
    includeDev = false,
  } = {},
) => {
  const d3n = new D3Node();
  const {d3} = d3n;
  const root = d3.hierarchy(processGraph(data, {maxDepth, includeDev}));

  const descendants = root.descendants();

  if (descendants.length > 100000) {
    logger.log(
      `\n\n⚠️ Your dependency tree has a very large number of nodes (${descendants.length}).`,
    );
    logger.log('Generating the tree chart might take a lot of time & memory.');
    logger.log('If the process crashes you have several options:');
    logger.log(
      '- Allocate more memory to the node process by exporting `NODE_OPTIONS="--max-old-space-size=16384"`',
    );
    logger.log(
      '- Reduce the depth of the tree represented by passing the `--max-depth` option to Sandworm',
    );
    logger.log('- Use the `--skip-tree` option to skip building the tree');
    logger.log('- Try another package manager');
  }

  // Construct an ordinal color scale
  const color = d3.scaleOrdinal(
    new Set([getModuleName(root), (root.children || []).map((d) => getModuleName(d))]),
    d3.schemeTableau10,
  );
  const nodeColor = (d) => color(getModuleName(d.ancestors().reverse()[1] || d));
  const textColor = (d) => {
    const issueLevel = getIssueLevel(d, issues);
    if (issueLevel === 'direct') {
      return 'red';
    }
    if (issueLevel === 'indirect') {
      return 'purple';
    }
    return '#333';
  };
  const textFontWeight = (d) => {
    if (getIssueLevel(d, issues) === 'none') {
      return 'normal';
    }
    return 'bold';
  };
  const strokeColor = (d) => {
    if (getIssueLevel(d, issues) === 'none') {
      return 'white';
    }
    return '#fff7c4';
  };
  const lineColor = (d1, d2) => {
    const destinationVulnerabilities = getReportsForNode(d2, issues);
    if (destinationVulnerabilities.length) {
      return 'red';
    }
    return 'black';
  };
  const lineDashStyle = (target) => {
    switch (target.data.rel) {
      case 'optional':
        return '4 6';
      case 'peer':
        return '4 1';
      case 'dev':
        return '5 10';
      default:
        return undefined;
    }
  };

  // Compute the layout.
  const padding = 1;
  const dx = 10;
  const dy = width / (root.height + padding);
  (tree || d3.tree)().nodeSize([dx, dy])(root);

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
    .createSVG()
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
    .attr('stroke', ({source, target}) => lineColor(source, target))
    .attr('stroke-dasharray', ({target}) => lineDashStyle(target));

  const node = svg
    .append('g')
    .attr('id', 'label-group')
    .selectAll('g')
    .data(descendants)
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

  addIssues(node, issues);
  addLicenseData(node);

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
    .text((d) => getModuleName(d, showVersions));

  addTooltips(svg);

  return d3n.svgString();
};

module.exports = buildTree;
