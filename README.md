<!-- Sandworm Logo -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="logo-light.png">
  <img alt="Sandworm Audit" src="logo-dark.png" width="478">
</picture>

<!-- A spacer -->
<p>&nbsp;</p>

Beautiful Security & License Compliance Reports For Your App's Dependencies 🪱

* Free & Open Source
* Scans for vulnerabilities, license, and misc issues
* Configurable license compliance policy
* Outputs easy to grok SVG dependency tree & treemap representations
  * Powered by D3
  * Overlays security vulnerabilities
  * Overlays package license info
* Outputs CSV of all dependencies & license info
* Outputs all reports in JSON format
* Works with npm, yarn, and pnpm
* Made by the team behind [Sandworm](https://sandworm.dev/) - Easy auditing & sandboxing for your JavaScript dependencies

![Sandworm Tooltips](https://sandworm-assets.s3.amazonaws.com/sinkchart/demos/sinkchart-tooltip.png)

> **Warning**
> Sandworm does NOT currently support [workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces).

### Get Involved

* Have a support question? [Post it here](https://github.com/sandworm-hq/sandworm-audit/discussions/categories/q-a).
* Have a feature request? [Post it here](https://github.com/sandworm-hq/sandworm-audit/discussions/categories/ideas).
* Did you find a security issue? [See SECURITY.md](SECURITY.md).
* Did you find a bug? [Post an issue](https://github.com/sandworm-hq/sandworm-audit/issues/new/choose).
* Want to write some code? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Install

```bash
yarn global add @sandworm/audit # or npm install -g @sandworm/audit
```

## Options

```
Options:
      --version          Show version number                           [boolean]
      --help             Show help                                     [boolean]
  -o, --output           The name of the output directory, relative to the
                         application path        [string] [default: ".sandworm"]
  -d, --include-dev      Include dev dependencies     [boolean] [default: false]
  -v, --show-versions    Show package versions        [boolean] [default: false]
  -p, --path             The application path    [string] [default: current dir]
      --md, --max-depth  Max depth to represent                         [number]
```

## Chart Types

### Treemap
* [Sample Treemap for Express@4.18.2](https://assets.sandworm.dev/charts/npm/express/4.18.2/treemap.svg)
* Node colors represent the dependency depth;
* Node surface represents the size of the corresponding directory under `node_modules`;
* A dotted pattern in a node background means the package is a shared dependency, required by multiple packages, and present multiple times in the chart;
* Shared dependency sizes are added to every dependent package, to represent the independent size structure properly; hence, the displayed size might be larger than the actual size on disk;
* A red package background means the package has direct vulnerabilities;
* A purple package background means the package depends on other vulnerable packages;
* Click on a node to make the tooltip persist; click outside to close it;
* When representing deep dependencies, the surface area of certain packages might reach zero, making them invisible.

### Tree
* [Sample Tree for Express@4.18.2](https://assets.sandworm.dev/charts/npm/express/4.18.2/tree.svg)
* Nodes are grouped by color based on the root dependency that they belong to;
* Red text in a package name means the package has direct vulnerabilities;
* Purple text in a package name means the package depends on other vulnerable packages;
* Click on a node to make the tooltip persist; click outside to close it;
* By default, the tree chart has a maximum depth of 7, meaning only seven levels of dependencies will be represented, to keep the output readable; you can override this using the `--md` option.

## Samples

* [Apollo Client](https://sandworm.dev/npm/package/apollo-client)
* [AWS SDK](https://sandworm.dev/npm/package/aws-sdk)
* [Express](https://sandworm.dev/npm/package/express)
* [Mocha](https://sandworm.dev/npm/package/mocha)
* [Mongoose](https://sandworm.dev/npm/package/mongoose)
* [Nest.js](https://sandworm.dev/npm/package/@nestjs/cli)
* [Redis](https://sandworm.dev/npm/package/redis)
