const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const yaml = require('js-yaml');

const {loadManifest, getPackageSize} = require('.');

const loadWorkspace = async (startPath) => {
  const resolvedAppPath = path.resolve(startPath);
  const manifestPath = path.join(resolvedAppPath, 'package.json');
  const pnpmConfigPath = path.join(resolvedAppPath, 'pnpm-workspace.yaml');
  let packagePaths;

  if (fs.existsSync(pnpmConfigPath)) {
    const pnpmConfig = yaml.load(fs.readFileSync(pnpmConfigPath, 'utf8'));

    if (Array.isArray(pnpmConfig.packages)) {
      packagePaths = pnpmConfig.packages;
    }
  }

  if (!packagePaths && fs.existsSync(manifestPath)) {
    const manifest = await loadManifest(resolvedAppPath);

    if (Array.isArray(manifest.workspaces)) {
      packagePaths = manifest.workspaces;
    }
  }

  if (packagePaths) {
    const entries = await fg(packagePaths, {
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

  if (resolvedAppPath !== '/') {
    return loadWorkspace(path.join(resolvedAppPath, '..'));
  }

  return null;
};

module.exports = {loadWorkspace};
