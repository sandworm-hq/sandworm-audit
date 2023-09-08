<!-- Sandworm Logo -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="logo-light.png">
  <img alt="Sandworm Audit" src="logo-dark.png" width="478">
</picture>

<!-- A spacer -->
<p>&nbsp;</p>

Beautiful Security & License Compliance Reports For Your App's Dependencies 🪱

## Summary

- Free & open source command-line tool
- Works with [npm](http://npmjs.com/), [Yarn](https://yarnpkg.com/), [pnpm](https://pnpm.io/), and [Composer](https://getcomposer.org/)
- Scans your project & dependencies for vulnerabilities, license, and metadata issues
- Supports npm/Yarn/pnpm workspaces
- Supports [marking issues as resolved](https://docs.sandworm.dev/audit/resolving-issues)
- Supports [custom license policies](https://docs.sandworm.dev/audit/license-policies)
- [Configurable fail conditions](https://docs.sandworm.dev/audit/fail-policies) for CI / GIT hook workflows
- Can connect to [private/custom npm registries](https://docs.sandworm.dev/audit/custom-registries)
- Outputs:
  - JSON issue & license usage reports
  - Easy to grok SVG dependency tree & treemap visualizations
    - Powered by D3
    - Overlays security vulnerabilities
    - Overlays package license info
  - CSV of all dependencies & license info

### Generate a report

![Running Sandworm Audit](https://assets.sandworm.dev/showcase/audit-terminal-output.gif)

### Navigate charts

![Sandworm treemap and tree dependency charts](https://assets.sandworm.dev/showcase/treemap-and-tree.png)

### CSV output

![Sandworm dependency CSV](https://assets.sandworm.dev/showcase/csv-snip.png)

### JSON output

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

![Marking issues as resolved](https://user-images.githubusercontent.com/5381731/224849330-226ef881-ffbf-4819-ba32-e434c8358f60.png)

### Get Involved

- Have a support question? [Post it here](https://github.com/sandworm-hq/sandworm-audit/discussions/categories/q-a).
- Have a feature request? [Post it here](https://github.com/sandworm-hq/sandworm-audit/discussions/categories/ideas).
- Did you find a security issue? [See SECURITY.md](SECURITY.md).
- Did you find a bug? [Post an issue](https://github.com/sandworm-hq/sandworm-audit/issues/new/choose).
- Want to write some code? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Get Started

> **Note**
> Sandworm Audit requires Node 14.19+.

Install `sandworm-audit` globally via your favorite package manager:

```bash
npm install -g @sandworm/audit
# or yarn global add @sandworm/audit
# or pnpm add -g @sandworm/audit
```

Then, run `sandworm-audit` in the root directory of your application. Make sure there's a manifest and a lockfile.

You can also directly run without installing via:

```bash
npx @sandworm/audit@latest
# or yarn dlx -p @sandworm/audit sandworm
# or pnpm --package=@sandworm/audit dlx sandworm
```

Available options:

```
Options:
  -v, --version               Show version number                      [boolean]
      --help                  Show help                                [boolean]
  -o, --output-path           The path of the output directory, relative to the
                              application path    [string] [default: "sandworm"]
  -d, --include-dev           Include dev dependencies[boolean] [default: false]
      --sv, --show-versions   Show package versions in chart names
                                                      [boolean] [default: false]
  -p, --path                  The path to the application to audit      [string]
      --md, --max-depth       Max depth to represent in charts          [number]
      --ms, --min-severity    Min issue severity to represent in charts [string]
      --lp, --license-policy  Custom license policy JSON string         [string]
  -f, --from                  Load data from "registry" or "disk"
                                                  [string] [default: "registry"]
      --fo, --fail-on         Fail policy JSON string   [string] [default: "[]"]
  -s, --summary               Print a summary of the audit results to the
                              console                  [boolean] [default: true]
      --root-vulnerabilites   Include vulnerabilities for the root project
                                                      [boolean] [default: false]
      --skip-license-issues   Skip scanning for license issues
                                                      [boolean] [default: false]
      --skip-meta-issues      Skip scanning for meta issues
                                                      [boolean] [default: false]
      --skip-tree             Don't output the dependency tree chart
                                                      [boolean] [default: false]
      --force-tree            Force build large dependency tree charts
                                                      [boolean] [default: false]
      --skip-treemap          Don't output the dependency treemap chart
                                                      [boolean] [default: false]
      --skip-csv              Don't output the dependency csv file
                                                      [boolean] [default: false]
      --skip-report           Don't output the report json file
                                                      [boolean] [default: false]
      --skip-all              Don't output any file   [boolean] [default: false]
      --show-tips             Show usage tips          [boolean] [default: true]
```

### Documentation

> [Read the full docs here](https://docs.sandworm.dev/audit).

## Samples on Sandworm.dev

- [Apollo Client](https://sandworm.dev/npm/package/apollo-client)
- [AWS SDK](https://sandworm.dev/npm/package/aws-sdk)
- [Express](https://sandworm.dev/npm/package/express)
- [Mocha](https://sandworm.dev/npm/package/mocha)
- [Mongoose](https://sandworm.dev/npm/package/mongoose)
- [Nest.js](https://sandworm.dev/npm/package/@nestjs/cli)
- [Redis](https://sandworm.dev/npm/package/redis)
