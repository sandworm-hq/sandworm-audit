const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');

const {loadManifest, getPackageSize} = require('.');

const loadWorkspace = async (startPath) => {
  const resolvedAppPath = path.resolve(startPath);
  const manifestPath = path.join(resolvedAppPath, 'package.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = await loadManifest(resolvedAppPath);

    if (Array.isArray(manifest.workspaces)) {
      const entries = await fg(manifest.workspaces, {
        onlyDirectories: true,
        unique: true,
        cwd: resolvedAppPath,
      });

      const workspaceProjects = await entries.reduce(async (aggPromise, relativePath) => {
        const agg = await aggPromise;
        const projectPath = path.join(resolvedAppPath, relativePath);
        const projectManifest = await loadManifest(projectPath);
        agg.push({
          ...projectManifest,
          relativePath,
          size: await getPackageSize(projectPath),
        });
        return agg;
      }, Promise.resolve([]));

      return {
        path: resolvedAppPath,
        workspaceProjects,
      };
    }
  }

  if (resolvedAppPath !== '/') {
    return loadWorkspace(path.join(resolvedAppPath, '..'));
  }

  return null;
};

module.exports = {loadWorkspace};
