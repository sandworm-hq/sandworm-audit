let globalUidIndex = 0;

const getUid = (type) => {
  const middle = type || `${Math.random().toString(16).slice(2)}`;
  const uid = `O-${middle}-${globalUidIndex}`;
  globalUidIndex += 1;

  return {id: uid, href: `url(#${uid})`};
};

const getModuleName = (d) => `${d.data.name}@${d.data.version}`;

const humanFileSize = (size) => {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / 1024 ** i).toFixed(2) * 1} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
};

const getAncestors = (d) =>
  d
    .ancestors()
    .reverse()
    .map((dd) => getModuleName(dd));

const groupByDepth = (root, maxDepth = Infinity) => {
  const map = [];
  const iterate = (node) => {
    const {depth, x0, x1, y0, y1} = node;
    if (x0 === x1 || y0 === y1) {
      return;
    }
    if (depth > maxDepth) {
      return;
    }
    let existingNodes = map[depth];
    if (!existingNodes) {
      existingNodes = [];
      map[depth] = existingNodes;
    }
    existingNodes.push(node);
    if (node.children) {
      node.children.forEach((child) => iterate(child));
    }
  };
  iterate(root);
  return map;
};

const addSandwormLogo = (svg, x, y, width) => {
  const sandwormLink = svg
    .append('a')
    .attr('id', 'sandworm-logo')
    .attr('href', 'https://sandworm.dev')
    .attr('target', '_blank');

  sandwormLink
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', width)
    .attr('height', 40)
    .attr('fill', '#333');

  sandwormLink
    .append('image')
    .attr(
      'href',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANcAAAA8CAMAAADCIN/GAAAC+lBMVEUAAAD/////wGH////////////////////////////////+3o3////////////////////83Iz////////////////////////////////////////////+sEX/2YT/////////////////////////qz3/pTP/oSz////////////////////////////////////////////+vVn/0nj/////////////////pzX/y2//////sUb/uVL/3Yr/13/+xGX/tEr/ozD/qTn/sUb/tk3/ozL/2IP/ozD/zG//pDL/03r/1IL/3oz/ulP/2YP/zHD/xWT/2IH2vmH/qDj/pjX/3In/tEn/tUr/xGP/3ov/3oz/zHD/3In/1oD/3Yv/3Yr/0Xb/ozD/oi//tEv/pTL/qz3/v1z/4I//3or///8AAAC+TgD/1H3/uVH/bQH/1n//vFX/03r/znP/qTj/2ob/vlr/rT//2IH/pzb8agL/0Xf/ozD/r0L/qzzDUQH/45D/yWr/sUT/5ZL/agH/wV7/t03/w2L/s0j/7Jb/xmb/6ZT/2YT/oi3/3Ii7TgD/3Yr/y27/pTP/bwn/tUr/4I6xm2HGVQf/znD/8Zq5ombWvHftZQru0YXmyoD/0XT9s0v01oj/2IPewnv/qTD/3IOOfE2JNwPCqmv/rjH+cBBRAQDQtnOFdEh/b0QhHQ4NCQPhXgKvSAKjQQFvHgD/2nqijFX/vEduaEH/sDk/NxzBVQy2SwH/zWbptmCok1z/xViYhlN3aUH/t0BqXDi3UxAZFAk4AAD/1XrKsG/SqV6lkFrknDtfVjR5XiwDKx0AGg+jSg71aAOBJgBuCgBgCgD/6o7/yF//wFDQlkFYTCmgaR9iSRvWXAYZAAD/54z/4YLctWfznzOKYiZNRSUsOiItJhTqwnDBmFDtqEijgUO+hTRGUDLWiyuxdidSPBKxTxCXQQnOVwaVKgB6CAD/956Udz+reTBxViRQFgHyynfBn12YcjNsQBKegHpSAAAAanRSTlMABQb4/Prz+wrK3P2kQeR4VfzQsQ8bFfXUvmZiKf748FzshTsi+vr4k6tOR4s3L7iXcTL7+MSdfmqB+o0M+KM3+/fbWkszJSLt42tmEeLGwn5ZGPrF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',
    )
    .attr('x', x + 5)
    .attr('y', y + 5)
    .attr('height', 30)
    .attr('opacity', 0.8);
};

const resolveVulnerability = (vulnerabilities) => (via) => {
  if (typeof via === 'string') {
    return vulnerabilities[via].via.map(resolveVulnerability(vulnerabilities));
  }

  return via;
};

const addVulnerabilities = (node, vulnerabilities) =>
  node
    .filter((d) => vulnerabilities[d.data.name])
    .append('vulnerabilities')
    .selectAll('vulnerability')
    .data((d) => {
      const {via} = vulnerabilities[d.data.name];
      const resolvedVulnerabilities = via.map(resolveVulnerability(vulnerabilities)).flat(Infinity);
      return [...new Map(resolvedVulnerabilities.map((item) => [item.url, item])).values()];
    })
    .join('vulnerability')
    .attr('title', (d) => d.title)
    .attr('url', (d) => d.url)
    .attr('via', (d) => (typeof d === 'string' ? d : undefined));


module.exports = {
  getModuleName,
  getUid,
  humanFileSize,
  getAncestors,
  groupByDepth,
  addSandwormLogo,
  addVulnerabilities,
};
