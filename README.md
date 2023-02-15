<!-- Sandworm Logo -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="logo-light.png">
  <img alt="Sandworm Audit" src="logo-dark.png" width="478">
</picture>

<!-- A spacer -->
<p>&nbsp;</p>

Beautiful Security & License Compliance Reports For Your App's Dependencies 🪱

## TL;DR
* Free & open source command-line tool
* Works with any JavaScript package manager
* Scans your project & dependencies for vulnerabilities, license, and misc issues
* Outputs:
  * JSON issue & license usage reports
  * Easy to grok SVG dependency tree & treemap visualizations
    * Powered by D3
    * Overlays security vulnerabilities
    * Overlays package license info
  * CSV of all dependencies & license info

```
Sandworm 🪱
Security and License Compliance Audit
✔ Built dependency graph
✔ Got vulnerabilities
✔ Scanned licenses
✔ Tree chart done
✔ Treemap chart done
✔ CSV done
✨ Done
```

![Sandworm Treemap and Tree Dependency Charts](https://assets.sandworm.dev/showcase/treemap-and-tree.png)

```json
{
  "createdAt": "...",
  "packageManager": "...",
  "name": "...",
  "version": "...",
  "rootVulnerabilities": [...],
  "dependencyVulnerabilities": [...],
  "licenseUsage": {...},
  "licenseIssues": [...],
  "metaIssues": [...],
  "errors": [...],
}
```

### Documentation

> [Read the full docs here](https://docs.sandworm.dev/audit).

### Get Involved

* Have a support question? [Post it here](https://github.com/sandworm-hq/sandworm-audit/discussions/categories/q-a).
* Have a feature request? [Post it here](https://github.com/sandworm-hq/sandworm-audit/discussions/categories/ideas).
* Did you find a security issue? [See SECURITY.md](SECURITY.md).
* Did you find a bug? [Post an issue](https://github.com/sandworm-hq/sandworm-audit/issues/new/choose).
* Want to write some code? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Get Started

```bash
npm install -g @sandworm/audit
# or yarn global add @sandworm/audit
# or pnpm add -g @sandworm/audit
```

Then, run `sandworm-audit` in the root directory of your application. Make sure there's a manifest and a lockfile.

Available options:

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

## Samples on Sandworm.dev

* [Apollo Client](https://sandworm.dev/npm/package/apollo-client)
* [AWS SDK](https://sandworm.dev/npm/package/aws-sdk)
* [Express](https://sandworm.dev/npm/package/express)
* [Mocha](https://sandworm.dev/npm/package/mocha)
* [Mongoose](https://sandworm.dev/npm/package/mongoose)
* [Nest.js](https://sandworm.dev/npm/package/@nestjs/cli)
* [Redis](https://sandworm.dev/npm/package/redis)
