/* global document, window */

const getBody = (string) => string.substring(string.indexOf('{') + 1, string.lastIndexOf('}'));

const setupTooltips = () => {
  const SEVERITY_ICONS = {
    critical: '🔴',
    high: '🟠',
    moderate: '🟡',
    low: '⚪',
  };
  let tooltipLock = false;
  const tooltip = document.getElementById('tooltip');
  const tooltipContainer = document.getElementById('tooltip-container');
  const tooltipBg = document.getElementById('tooltip-bg');
  const tooltipContent = document.getElementById('tooltip-content');
  const labels = Array.prototype.slice.call(document.getElementsByTagName('g'));
  const viewBox = document.documentElement.attributes.viewBox.value;
  const [offsetX, offsetY, viewBoxWidth, viewBoxHeight] = viewBox.split(',').map(parseFloat);
  const maxX = offsetX + viewBoxWidth;
  const maxY = offsetY + viewBoxHeight;
  const getHTML = (ancestry, issues, licenseName) => {
    let html =
      '<div style="padding: 2px; background: #777; color: white; margin-bottom: 2px;">Path</div>';
    html += `<div>${ancestry.join('<br/>')}</div>`;

    html +=
      '<div style="padding: 2px; background: #777; color: white; margin: 2px 0;">License</div>';
    html += `<div>${licenseName || 'N/A'}</div>`;

    if (issues.length) {
      html +=
        '<div style="padding: 2px; background: #777; color: white; margin: 2px 0;">Issues</div>';
      issues.forEach(({title, url, severity = 'critical'}) => {
        html += `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${SEVERITY_ICONS[severity]} ${url ? `<a href="${url}" target="_blank">` : ''}${title}${
          url ? '</a>' : ''
        }
        </div>`;
      });
    }

    return html;
  };

  document.documentElement.addEventListener('click', (e) => {
    if (e.target === document.documentElement) {
      tooltipLock = false;
      tooltip.setAttribute('visibility', 'hidden');
    }
  });

  labels.forEach((a) => {
    if (
      !['label-group', 'path-group', 'tooltip'].includes(a.id) &&
      !a.classList.contains('depth-group')
    ) {
      const ancestry = a.getElementsByTagName('ancestry')[0].getAttribute('data').split('>');
      const issues = Array.prototype.slice
        .call((a.getElementsByTagName('issues')[0] || {}).children || [])
        .map((issue) => ({
          title: issue.getAttribute('title'),
          url: issue.getAttribute('url'),
          severity: issue.getAttribute('severity'),
        }));
      const target = a.getElementsByTagName('text')[0];
      let licenseName = null;
      const licenseContainers = a.getElementsByTagName('license');
      if (licenseContainers.length > 0) {
        licenseName = licenseContainers[0].getAttribute('name');
      }
      target.addEventListener('mouseover', (event) => {
        if (!tooltipLock) {
          tooltipContent.innerHTML = getHTML(ancestry, issues, licenseName);
          const {width: currentWidth} = document.documentElement.getBoundingClientRect();
          const scale = currentWidth / viewBoxWidth;
          const height =
            10 + // top/bottom padding
            18 + // path header
            ancestry.length * 11.5 + // path section height
            (issues.length ? 20 : 0) + // vulnerabilities header
            issues.length * 15 + // vulnerabilities
            20 + // license header
            15; // license body
          const maxAncestorNameLength = ancestry.reduce(
            (length, name) => (name.length > length ? name.length : length),
            0,
          );
          const width = issues.length ? 180 : maxAncestorNameLength * 6 + 10;
          const source = event.composedPath().find((e) => e.nodeName === 'g');
          const rect = source.getBoundingClientRect();
          const defaultPositionX = offsetX + (rect.left + window.scrollX) / scale;
          const defaultPositionY = offsetY + (rect.top + window.scrollY) / scale + 20;
          const defaultPositionBottomY = defaultPositionY + height;
          const defaultPositionRightX = defaultPositionX + width;
          let tooltipX = defaultPositionX;
          let tooltipY = defaultPositionY;

          if (defaultPositionRightX > maxX) {
            tooltipX -= width - rect.width;
          }
          if (defaultPositionBottomY > maxY) {
            tooltipY -= height + 30;
          }

          tooltipContainer.setAttribute('height', height);
          tooltipContainer.setAttribute('width', width);
          tooltipBg.setAttribute('height', height);
          tooltipBg.setAttribute('width', width);
          tooltip.setAttribute('visibility', 'visible');
          tooltip.setAttribute('transform', `translate(${tooltipX} ${tooltipY})`);
        }
      });
      target.addEventListener('click', () => {
        tooltipLock = !tooltipLock;
        if (!tooltipLock) {
          tooltip.setAttribute('visibility', 'hidden');
        }
      });
      target.addEventListener('mouseleave', () => {
        if (!tooltipLock) {
          tooltip.setAttribute('visibility', 'hidden');
        }
      });
    }
  });
};

const addTooltips = (svg) => {
  const tooltip = svg.append('g').attr('id', 'tooltip').attr('visibility', 'hidden');

  tooltip
    .append('rect')
    .attr('id', 'tooltip-bg')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 150)
    .attr('height', 80)
    .attr('fill', 'white')
    .attr('stroke', '#888');

  tooltip
    .append('foreignObject')
    .attr('id', 'tooltip-container')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 150)
    .attr('height', 80)
    .append('div')
    .attr('xmlns', 'http://www.w3.org/1999/xhtml')
    .append('div')
    .attr('id', 'tooltip-content')
    .attr('style', 'padding: 5px;');

  svg.append('script').text(`
  //<![CDATA[
    ${getBody(setupTooltips.toString())}
  //]]>
  `);
};

module.exports = addTooltips;
