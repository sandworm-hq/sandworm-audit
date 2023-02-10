# Contributing

## Introduction

First off, thank you for considering contributing to Sandworm.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

Sandworm is an open source project and we love to receive contributions from our community — you! There are many ways to contribute, from writing tutorials or blog posts, improving the documentation, submitting bug reports and feature requests or writing code which can be incorporated into Sandworm itself.

## How to report a bug

If you find a security issue or a vulnerability in Sandworm, please do NOT open an issue. See [SECURITY.md](security.md) instead.

When filing an issue with our GitHub issue tracker, make sure to answer these five questions:

* What version of Sandworm are you using?
* What Node version are you using?
* What package manager are you using?
* What did you do?
* What did you expect to see?
* What did you see instead?

Please add the `bug` label to all bug-reporting issues.

## How to suggest a feature or enhancement

If you find yourself wishing for a feature that doesn't exist in Sandworm, you are probably not alone! Please [create a new discussion here](https://github.com/sandworm-hq/Sandworm/discussions/categories/ideas) which describes the feature you would like to see, why you need it, and how it should work.

## Ground Rules

Contributor responsibilities:

* Create issues for any major changes and enhancements that you wish to make. Discuss things transparently and get community feedback.
* Keep feature versions as small as possible, preferably one new feature per version.
* Be welcoming to newcomers and encourage diverse new contributors from all backgrounds. See the [Sandworm Community Code of Conduct](code-of-conduct.md).

## Contributing

To contribute on an issue:

* Create your own fork of the code.
* Do the changes in your fork.
* Be sure you have followed the code style for the project:
  * We use a slightly modified version of the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) for all the core code, and [react-app](https://www.npmjs.com/package/eslint-config-react-app) for the Inspector React app.
  * We use Prettier for formatting (see `.prettierrc`).
  * Everything's enforced via ESLint - run `yarn lint` to lint everything.
* Commits should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
* Note the [Sandworm Code of Conduct](code-of-conduct.md).
* Send a pull request!
  * Working on your first Pull Request? You can learn how from this free series, [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).
  * If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

## Attribution

This Contributing document is adapted from [the Contributing Guides Template](https://github.com/nayafia/contributing-template/blob/master/CONTRIBUTING-template.md).
