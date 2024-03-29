# Changelog

## [1.56.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.56.0...audit-v1.56.1) (2023-10-24)


### Bug Fixes

* crash when skipping tree svg output ([c4097d5](https://github.com/sandworm-hq/sandworm-audit/commit/c4097d5ba244521a695de9ae1428bc8d480d774f))
* limit pathfinding to depth 9 ([a7fecbc](https://github.com/sandworm-hq/sandworm-audit/commit/a7fecbceb09534415755c16e0aadb06a83972bb9))

## [1.56.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.55.2...audit-v1.56.0) (2023-10-09)


### Features

* composer install script detection ([c814178](https://github.com/sandworm-hq/sandworm-audit/commit/c814178d077f890da45c1881c4ff18bca0b17fdb))

## [1.55.2](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.55.1...audit-v1.55.2) (2023-09-28)


### Bug Fixes

* graph gen for version-less packages ([bce6293](https://github.com/sandworm-hq/sandworm-audit/commit/bce62933ff0984af28708a9b115c06b4cde9b565))

## [1.55.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.55.0...audit-v1.55.1) (2023-09-28)


### Bug Fixes

* support `x.y` packagist semver format ([3aefc78](https://github.com/sandworm-hq/sandworm-audit/commit/3aefc781b33bbf7fe73ff369e1e5f4a5c12fd7ea))

## [1.55.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.54.1...audit-v1.55.0) (2023-09-26)


### Features

* better license expression issue titles ([3f3aad9](https://github.com/sandworm-hq/sandworm-audit/commit/3f3aad9882148d9e5a918c1795f982a526cdd4fc))

## [1.54.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.54.0...audit-v1.54.1) (2023-09-26)


### Bug Fixes

* support license string arrays ([f01c7cf](https://github.com/sandworm-hq/sandworm-audit/commit/f01c7cfffa82bbbfa5209081b77db3a9abb38d51))

## [1.54.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.53.1...audit-v1.54.0) (2023-09-26)


### Features

* package type target config for resolve cli ([fd651c3](https://github.com/sandworm-hq/sandworm-audit/commit/fd651c30b1f6450c898efdb70d035c09ce20a6e9))


### Bug Fixes

* package type selection for mixed directories ([84ce307](https://github.com/sandworm-hq/sandworm-audit/commit/84ce3075fc0a58072782489923f431c29c8c618c))

## [1.53.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.53.0...audit-v1.53.1) (2023-09-15)


### Bug Fixes

* composer audit issue ([912148f](https://github.com/sandworm-hq/sandworm-audit/commit/912148f41290027b4891f0449161f4c77bfdb068))
* only scan root vulns when name&version exist ([6d89eee](https://github.com/sandworm-hq/sandworm-audit/commit/6d89eee6cb3306387d78a74c278224378f7fc1a7))

## [1.53.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.52.0...audit-v1.53.0) (2023-09-15)


### Features

* detect php deprecated packages ([2ef385b](https://github.com/sandworm-hq/sandworm-audit/commit/2ef385bf4dc009b8d7c94aefc738653a9abf0afd))

## [1.52.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.51.1...audit-v1.52.0) (2023-09-08)


### Features

* package type config for multi-package dirs ([4e2828a](https://github.com/sandworm-hq/sandworm-audit/commit/4e2828a41532fe5fdc56bdc0e9fae438ae5effef))

## [1.51.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.51.0...audit-v1.51.1) (2023-09-08)


### Bug Fixes

* load composer root packages with no version ([65dad8e](https://github.com/sandworm-hq/sandworm-audit/commit/65dad8e5abeb82b40552925eb1f9ab4718d426f5))

## [1.51.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.50.0...audit-v1.51.0) (2023-09-08)


### Features

* experimental Composer support ([93c9e4b](https://github.com/sandworm-hq/sandworm-audit/commit/93c9e4be1ddabb4f2d087a5b467b317ec2f73f79))

## [1.50.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.49.0...audit-v1.50.0) (2023-09-04)


### Features

* better registry api fetch ([d60866b](https://github.com/sandworm-hq/sandworm-audit/commit/d60866be0d55aabdd3bc905ca992dba5f386e6b4))

## [1.49.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.48.3...audit-v1.49.0) (2023-09-04)


### Features

* better package metadata retrieval ([3cce2e7](https://github.com/sandworm-hq/sandworm-audit/commit/3cce2e7311c6fb7e28503ec9cbbece091969f21b))

## [1.48.3](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.48.2...audit-v1.48.3) (2023-09-02)


### Bug Fixes

* load locally installed workspace module data ([ba02ea9](https://github.com/sandworm-hq/sandworm-audit/commit/ba02ea926e07209e885d11c086d509e4deb82dc0))

## [1.48.2](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.48.1...audit-v1.48.2) (2023-09-02)


### Bug Fixes

* support yarn alternative workspaces object ([448e3d3](https://github.com/sandworm-hq/sandworm-audit/commit/448e3d300010e049f73189a617a883ebaa37fba7)), closes [#131](https://github.com/sandworm-hq/sandworm-audit/issues/131)

## [1.48.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.48.0...audit-v1.48.1) (2023-09-01)


### Bug Fixes

* workspace additional data issue ([2b1c6f3](https://github.com/sandworm-hq/sandworm-audit/commit/2b1c6f3a4bb3259dc0e6dd60fbf4b9d2f3a91fd9))

## [1.48.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.47.0...audit-v1.48.0) (2023-08-31)


### Features

* skip missing repo check for workspace ([01db288](https://github.com/sandworm-hq/sandworm-audit/commit/01db288ed62e04206eeab4a5759e246a740ba6e1))
* use workspace packages metadata ([eb98635](https://github.com/sandworm-hq/sandworm-audit/commit/eb9863501ff9ab4132515d301e00a79cdabb069e))

## [1.47.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.46.0...audit-v1.47.0) (2023-08-31)


### Features

* configurable build for large trees ([5a7623b](https://github.com/sandworm-hq/sandworm-audit/commit/5a7623bd58ab4b26317670be3cc434e2012eda20))

## [1.46.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.45.0...audit-v1.46.0) (2023-08-25)


### Features

* label dependency relations in charts ([98fc1e8](https://github.com/sandworm-hq/sandworm-audit/commit/98fc1e8e2a1576d522a8dcc998d80109667ac10b))
* support npm v1 lockfiles ([f5da842](https://github.com/sandworm-hq/sandworm-audit/commit/f5da842826a9bb9c6cea6ab9e99aba8d58bc834a))

## [1.45.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.44.0...audit-v1.45.0) (2023-08-23)


### Features

* support pnpm workspaces ([d22b946](https://github.com/sandworm-hq/sandworm-audit/commit/d22b9464fe27f26f9c2406d51a671b9eaceb7a16))

## [1.44.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.43.1...audit-v1.44.0) (2023-08-23)


### Features

* basic support for workspaces ([2e0868e](https://github.com/sandworm-hq/sandworm-audit/commit/2e0868e2ab110052079d4cb6c64b2a3cd018662d))

## [1.43.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.43.0...audit-v1.43.1) (2023-07-27)


### Bug Fixes

* issue path limit ([8271213](https://github.com/sandworm-hq/sandworm-audit/commit/827121308d52a9d40f980faa062296d8be8bd2df))

## [1.43.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.42.1...audit-v1.43.0) (2023-07-27)


### Features

* limit issue path count ([da8247f](https://github.com/sandworm-hq/sandworm-audit/commit/da8247fb5bdfe36feeaddab1e2f74c650f11b690))

## [1.42.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.42.0...audit-v1.42.1) (2023-07-22)


### Bug Fixes

* add `type` to vulnerability report json ([1f5a84e](https://github.com/sandworm-hq/sandworm-audit/commit/1f5a84ef30e9b495e66a7a9a1d9f3d2989eac673))

## [1.42.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.41.0...audit-v1.42.0) (2023-05-12)


### Features

* root project vulnerability scan now optional ([ffc121d](https://github.com/sandworm-hq/sandworm-audit/commit/ffc121d98413005fc685175f18211ce3ff12143e))

## [1.41.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.40.0...audit-v1.41.0) (2023-05-10)


### Features

* include stack details in error logging ([d910d2a](https://github.com/sandworm-hq/sandworm-audit/commit/d910d2a34ccf377b0035eb3a73cc293b77705260))

## [1.40.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.39.2...audit-v1.40.0) (2023-05-10)


### Features

* better vulnerability report retrieval errors ([2ce3e10](https://github.com/sandworm-hq/sandworm-audit/commit/2ce3e10ba70d11efc848e6f408daf69e66dfaed4))

## [1.39.2](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.39.1...audit-v1.39.2) (2023-05-05)


### Bug Fixes

* using `fetch` without loading it ([d65aa9d](https://github.com/sandworm-hq/sandworm-audit/commit/d65aa9d31af9539e56efacb51c60d29620e15c45))

## [1.39.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.39.0...audit-v1.39.1) (2023-05-05)


### Bug Fixes

* `normalizeLicense('null')` crash ([96e1afc](https://github.com/sandworm-hq/sandworm-audit/commit/96e1afce8932985000b313ff28772c52f8cde2a1))

## [1.39.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.38.1...audit-v1.39.0) (2023-05-03)


### Features

* add audit configuration info to json report ([9faf902](https://github.com/sandworm-hq/sandworm-audit/commit/9faf9020c17a546f81e0dc7039a79bcaa1c9d3b8))
* configs to skip license/meta issue checks ([eb5064c](https://github.com/sandworm-hq/sandworm-audit/commit/eb5064ccdeb464eebaa4df3f865ff545fb67b271))

## [1.38.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.38.0...audit-v1.38.1) (2023-04-27)


### Bug Fixes

* lazy-load `fetch` ([73aacb5](https://github.com/sandworm-hq/sandworm-audit/commit/73aacb5e622e6f2e9e224d1612ce07cf8cd4cb05))

## [1.38.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.37.0...audit-v1.38.0) (2023-04-26)


### Features

* cli args license&fail policy valid json check ([6a0592d](https://github.com/sandworm-hq/sandworm-audit/commit/6a0592d69dacc5c53a1c401c2fe2757fdbfa4f23))
* enforce min node version ([7560c64](https://github.com/sandworm-hq/sandworm-audit/commit/7560c64247783062e0749578194a16105855c4c8))

## [1.37.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.36.2...audit-v1.37.0) (2023-04-25)


### Features

* improve type validations ([38b7bac](https://github.com/sandworm-hq/sandworm-audit/commit/38b7baccd475e591a9e1ec0fb4e438215714aee2))

## [1.36.2](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.36.1...audit-v1.36.2) (2023-04-25)


### Bug Fixes

* tips display crash in non-tty envs ([afd121c](https://github.com/sandworm-hq/sandworm-audit/commit/afd121c118f1935837b68b2b03f770addf1484b3))

## [1.36.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.36.0...audit-v1.36.1) (2023-04-24)


### Bug Fixes

* crash on non-string npmrc configs ([ab49e97](https://github.com/sandworm-hq/sandworm-audit/commit/ab49e970a0df42233fab6bf559ba4ce70174be61))

## [1.36.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.35.1...audit-v1.36.0) (2023-04-13)


### Features

* accept wildcard version in resolved issue id ([1565943](https://github.com/sandworm-hq/sandworm-audit/commit/1565943d333c632664e53c4c1c0ca177a333e73a))
* support custom license categories ([68b7791](https://github.com/sandworm-hq/sandworm-audit/commit/68b7791328af076ccbcd498d855c23dcbb019805))
* support editing default license categories ([0f473cc](https://github.com/sandworm-hq/sandworm-audit/commit/0f473cc04fd6020bdc78703f5a1b9334dbd7af2e))
* support private registries ([b36cba0](https://github.com/sandworm-hq/sandworm-audit/commit/b36cba014f6a2a4ff2850daa8e88650cb90ebcbf))

## [1.35.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.35.0...audit-v1.35.1) (2023-04-07)


### Bug Fixes

* pnpm graph gen issue ([de15efa](https://github.com/sandworm-hq/sandworm-audit/commit/de15efa85fb2ec1d20b065a8cd0bfda2ca93f775))
* support pnpm lockfile v6 ([eb88694](https://github.com/sandworm-hq/sandworm-audit/commit/eb88694b6dcd51b46d359ca40477acc9b66336e7))

## [1.35.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.34.0...audit-v1.35.0) (2023-03-25)


### Features

* show tips while building dep graph ([a4f1b32](https://github.com/sandworm-hq/sandworm-audit/commit/a4f1b323204555e3fddf1520f4db8f54ea38ad43))

## [1.34.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.33.0...audit-v1.34.0) (2023-03-24)


### Features

* audit output now configurable ([77e0099](https://github.com/sandworm-hq/sandworm-audit/commit/77e0099b230b89e2e1e42244a7fc36d595872d80))
* more efficient registry queries ([166c2fd](https://github.com/sandworm-hq/sandworm-audit/commit/166c2fd78a0629922477136141ba3561bb195898))

## [1.33.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.32.1...audit-v1.33.0) (2023-03-22)


### Features

* more permissive `normalizeLicense` ([28dd24a](https://github.com/sandworm-hq/sandworm-audit/commit/28dd24ae2ca6ca76322f3fa6251bfbaf57a0b8c9))


### Bug Fixes

* crash for apps with no manifest name ([4e97c8c](https://github.com/sandworm-hq/sandworm-audit/commit/4e97c8c747353c244d16b43f834993c149a4d0fa))

## [1.32.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.32.0...audit-v1.32.1) (2023-03-20)


### Bug Fixes

* normalizing null licenses ([9de645d](https://github.com/sandworm-hq/sandworm-audit/commit/9de645d3cbe7f02006c8d123545c49316b98d12c))

## [1.32.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.31.0...audit-v1.32.0) (2023-03-20)


### Features

* export `normalizeLicense` method ([acd5c6f](https://github.com/sandworm-hq/sandworm-audit/commit/acd5c6fb961f8b014ada5b9dd8bd320975932ee4))

## [1.31.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.30.0...audit-v1.31.0) (2023-03-17)


### Features

* notify about very large trees ([d9e5f8c](https://github.com/sandworm-hq/sandworm-audit/commit/d9e5f8c6110cfe82f33aaa8023b54cd6a5de3cf3))
* opt-in crash reports ([84c90c5](https://github.com/sandworm-hq/sandworm-audit/commit/84c90c513ea3a0634c8d435bb26301c50f9e40c4))


### Bug Fixes

* file name undefined version ([0fba979](https://github.com/sandworm-hq/sandworm-audit/commit/0fba97913515380a010cb1b85c52aea6b3e761e6))
* yarn audit warnings treated as errors ([f187ce7](https://github.com/sandworm-hq/sandworm-audit/commit/f187ce7512ca3ee79fd67c7fcbaf5d3f795db3d9))

## [1.30.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.29.1...audit-v1.30.0) (2023-03-15)


### Features

* `-v` option now outputs current version ([1b72ff1](https://github.com/sandworm-hq/sandworm-audit/commit/1b72ff1e036c85faa815deaa20cde44ce2a75623))
* display dependency graph progress ([69d9975](https://github.com/sandworm-hq/sandworm-audit/commit/69d99754d78efb90e0a899e674a1ab1244596d7f))
* support marking issues as resolved ([e9b6208](https://github.com/sandworm-hq/sandworm-audit/commit/e9b62086afac43f92bdbc12522efadc34d98c33a))

## [1.29.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.29.0...audit-v1.29.1) (2023-03-10)


### Bug Fixes

* false audit issues with root shell config ([1dbc0a5](https://github.com/sandworm-hq/sandworm-audit/commit/1dbc0a57cafd1e6dd0a367a920a96872d914dfc5))

## [1.29.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.28.0...audit-v1.29.0) (2023-03-10)


### Features

* outdated check now runs parallel to audit ([e501a97](https://github.com/sandworm-hq/sandworm-audit/commit/e501a976525e71abb97343d44d13f094afee9e83))


### Bug Fixes

* all packages array bug for shell root setup ([5da5001](https://github.com/sandworm-hq/sandworm-audit/commit/5da50017d14a8f3375739b4b8eef237d24cc2fc6))
* support empty csv output ([8e69060](https://github.com/sandworm-hq/sandworm-audit/commit/8e690602c12f970e831c11744a5d7c4c3bded77c))

## [1.28.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.27.0...audit-v1.28.0) (2023-03-08)


### Features

* notification on new version available ([8ddf36d](https://github.com/sandworm-hq/sandworm-audit/commit/8ddf36d3421360fe74fac2613b6527ac359d041d))


### Bug Fixes

* better lockfile parsing errors ([a9bb92e](https://github.com/sandworm-hq/sandworm-audit/commit/a9bb92ebcb53e06c887f4d010f04cef6335d2ff6))
* manifest engine requirements ([61d00a3](https://github.com/sandworm-hq/sandworm-audit/commit/61d00a31b1a69f5cc0205aa5427a8ed2114891d5))

## [1.27.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.26.0...audit-v1.27.0) (2023-03-07)


### Features

* generate ids for Sandworm issues ([ccaf8ea](https://github.com/sandworm-hq/sandworm-audit/commit/ccaf8ea1e7c92470151b3b7b1fed0f935cea884b))


### Bug Fixes

* better error for no lockfile found ([4c430d9](https://github.com/sandworm-hq/sandworm-audit/commit/4c430d9fbbb5967f9195b1b1d847a23f15a588c3))

## [1.26.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.25.0...audit-v1.26.0) (2023-02-28)


### Features

* better install script issues ([7c9fd4d](https://github.com/sandworm-hq/sandworm-audit/commit/7c9fd4d8a984acc6171802e2c8708c19548f0db6))
* support root shell project ([bb484df](https://github.com/sandworm-hq/sandworm-audit/commit/bb484dfed06298c9782dc098517fc35a1a48dad8))


### Bug Fixes

* additional pnpm semver parsing issue ([3f4fa77](https://github.com/sandworm-hq/sandworm-audit/commit/3f4fa77f80919d050578c62ac6387052808d723d))
* get registry data for dev deps ([103af11](https://github.com/sandworm-hq/sandworm-audit/commit/103af1143be64c1b70a6cb9fb053250c08986701))
* getting paths for dev dep issues ([03adb07](https://github.com/sandworm-hq/sandworm-audit/commit/03adb077c1620477d4073d06028fddbba436c8d5))
* issue sources for root vulnerabilities ([a85d54b](https://github.com/sandworm-hq/sandworm-audit/commit/a85d54b00e2a1f498a5f4e00c5f063804af64576))
* parsing pnpm package version from lockfile ([4667cde](https://github.com/sandworm-hq/sandworm-audit/commit/4667cde75ba15bdadd4339e46596cae5ab1c11b2))

## [1.25.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.24.0...audit-v1.25.0) (2023-02-26)


### Features

* output audit summary in console ([4240198](https://github.com/sandworm-hq/sandworm-audit/commit/42401982e1b2bd82e3ab4e17abe235eac66ef7ec))


### Bug Fixes

* issue paths for non-prod deps ([ad1049a](https://github.com/sandworm-hq/sandworm-audit/commit/ad1049a11f924bc2514cdb37632ea12dc721fde9))
* properly encode csv quotes ([772793f](https://github.com/sandworm-hq/sandworm-audit/commit/772793f87f691f56181445b23f613b379511cc3c))
* specify required node version ([4ef5b8a](https://github.com/sandworm-hq/sandworm-audit/commit/4ef5b8a3dd02db1af9c73e6529fe45b4bd8e67af))

## [1.24.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.23.0...audit-v1.24.0) (2023-02-23)


### Features

* more info available in the csv output ([d0d95b5](https://github.com/sandworm-hq/sandworm-audit/commit/d0d95b5ca1caefc8099d8251a16b2e3665c871e2))
* update default output dir name to `sandworm` ([90eef86](https://github.com/sandworm-hq/sandworm-audit/commit/90eef86110e1d85d6c4e8fb64e434408e171b75a))

## [1.23.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.22.0...audit-v1.23.0) (2023-02-21)


### Features

* cli now outputs issue counts ([9cc2d1f](https://github.com/sandworm-hq/sandworm-audit/commit/9cc2d1fe18d1a91e6256ac59c111efcecd3f845e))
* fail on specific issue type and/or severity ([e19f48a](https://github.com/sandworm-hq/sandworm-audit/commit/e19f48a37ad03e9a0dd5ce8da268d4d1cc7649f8))

## [1.22.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.21.1...audit-v1.22.0) (2023-02-19)


### Features

* api now supports custom license policies ([b890b92](https://github.com/sandworm-hq/sandworm-audit/commit/b890b920e72364b88e0877a3e19bd3d5807ecc34))
* graph metadata soure now configurable in api ([a4e09ee](https://github.com/sandworm-hq/sandworm-audit/commit/a4e09ee2948a401d852373c5ae3712188270e0a9))
* include graph gen errors in error output ([8deb50f](https://github.com/sandworm-hq/sandworm-audit/commit/8deb50f379520c2a9523e672d8c971d389452cd8))
* support configuration file ([39b84c8](https://github.com/sandworm-hq/sandworm-audit/commit/39b84c86d08589b7fe41d07b9b7d5d7c0335c59a))


### Bug Fixes

* invalid extra registry call ([6ec0ede](https://github.com/sandworm-hq/sandworm-audit/commit/6ec0edeaf42ce5c628f9e849ebec5bfba597889b))

## [1.21.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.21.0...audit-v1.21.1) (2023-02-17)


### Bug Fixes

* labeling nodes in cyclic dep graph ([1b4b90e](https://github.com/sandworm-hq/sandworm-audit/commit/1b4b90e2719a975a4e0760b404b851942dd13c5f))

## [1.21.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.20.2...audit-v1.21.0) (2023-02-14)


### Features

* better license and meta issue titles ([e118686](https://github.com/sandworm-hq/sandworm-audit/commit/e118686e579ba1bc2ffbc89009e67766e4aa46f1))

## [1.20.2](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.20.1...audit-v1.20.2) (2023-02-14)


### Bug Fixes

* infinte recursion when getting dep paths ([e5d2c70](https://github.com/sandworm-hq/sandworm-audit/commit/e5d2c70364f65f19e25404731e6996939d04e164))

## [1.20.1](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.20.0...audit-v1.20.1) (2023-02-14)


### Bug Fixes

* ci publish pipeline ([3caa94f](https://github.com/sandworm-hq/sandworm-audit/commit/3caa94f4bd0af1678578870b0bab75cc8759e14e))

## [1.20.0](https://github.com/sandworm-hq/sandworm-audit/compare/audit-v1.19.1...audit-v1.20.0) (2023-02-14)


### Features

* better error aggregation ([7a200fd](https://github.com/sandworm-hq/sandworm-audit/commit/7a200fdf62215005e77a47c18bd7cb40cf2f935c))
* scan for metadata issues ([6bc8a4a](https://github.com/sandworm-hq/sandworm-audit/commit/6bc8a4acecb313d82034fe9e1bd1b902472552a0))


### Bug Fixes

* scoped package output filename ([6878e82](https://github.com/sandworm-hq/sandworm-audit/commit/6878e82fe6a546dc2b9061734dcee2287c7107ea))
* update utils module name ([6710f13](https://github.com/sandworm-hq/sandworm-audit/commit/6710f13c559c53be6536551dcbd6828b1452adb6))

## [1.19.1](https://github.com/sandworm-hq/audit/compare/audit-v1.19.0...audit-v1.19.1) (2023-02-10)


### Bug Fixes

* ci pipeline config to trigger deploys ([5b89679](https://github.com/sandworm-hq/audit/commit/5b8967994a273e354118678d11401af618e47ba6))

## [1.19.0](https://github.com/sandworm-hq/audit/compare/audit-v1.18.0...audit-v1.19.0) (2023-02-10)


### Features

* add config to disable size scanning ([88dda72](https://github.com/sandworm-hq/audit/commit/88dda724d6296ca6c7ca9aed49389750bd3f751d))
* add license info to tooltip, when available ([291991c](https://github.com/sandworm-hq/audit/commit/291991cb5cfaf0bc4441211a4d5f7df4412d197d))
* allow providing custom dep graphs ([e3b4a77](https://github.com/sandworm-hq/audit/commit/e3b4a77a048b6828e64462b7555d8f975c23635c))
* better license usage data structure ([3e373fa](https://github.com/sandworm-hq/audit/commit/3e373fa41b72b2d091865ea0ffa621f2d9ab10ce))
* better package size estimation ([c98752f](https://github.com/sandworm-hq/audit/commit/c98752f5b7ae5ce0fcb0fb05532b37664cda1974))
* better treemap package labeling ([3bfadd7](https://github.com/sandworm-hq/audit/commit/3bfadd7a0a17e7950009985c06b8f66216fae4e4))
* better vulnerability reporting ([e33941e](https://github.com/sandworm-hq/audit/commit/e33941eb27276c9a780489e5672e123f55459cd2))
* better vulnerability reporting ([976dad6](https://github.com/sandworm-hq/audit/commit/976dad6486bdb75587715b433bd8f4bcbd12ff06))
* build all charts by default ([a1db19a](https://github.com/sandworm-hq/audit/commit/a1db19ad97b747989c078be109643eefc1f1e889))
* charts now display license issues ([9b38f08](https://github.com/sandworm-hq/audit/commit/9b38f089b624faf9dad4869a4b39d13501edb797))
* cli now displays licence scanning phase ([b5467f8](https://github.com/sandworm-hq/audit/commit/b5467f8ab633fdee45f32d81db798943e8a1b113))
* cli now generates json report in output dir ([d1c5283](https://github.com/sandworm-hq/audit/commit/d1c528398cee197c4de24e0b2d2b0af70a08f88a))
* configurable min severity level for charts ([2950408](https://github.com/sandworm-hq/audit/commit/2950408da998eb294e6a37d105cc1d1d7bb79ddc))
* expose array with processed dependency data ([557cfe4](https://github.com/sandworm-hq/audit/commit/557cfe41710e9c651fe0489dc3785a8e2572c0da))
* icon now represents severity in node tooltip ([8ccfb97](https://github.com/sandworm-hq/audit/commit/8ccfb97e99c69ec2c622850b7d4c0101a0c1fb64))
* include license issue recommendations ([f2af2f4](https://github.com/sandworm-hq/audit/commit/f2af2f4c950e9739ff0a617d0eb727dfdae53203))
* include vulnerabilities in exported data ([2528072](https://github.com/sandworm-hq/audit/commit/2528072c04d329cc9647c305d3f4f1f008e2cf32))
* initial commit ([f46ae74](https://github.com/sandworm-hq/audit/commit/f46ae749dbb3dee41d79099004cb521387e26415))
* output all dependency data as csv ([eb92647](https://github.com/sandworm-hq/audit/commit/eb9264766631ef3c17a8c64cbde72b7ca66b8b90))
* output license usage and issues ([99aa988](https://github.com/sandworm-hq/audit/commit/99aa988001b22c64313fd5f28231a1401c539a90))
* remove svg width and height attributes ([b9e3d45](https://github.com/sandworm-hq/audit/commit/b9e3d45020996ed91a8cdc9d81c71d28ca2b91f0))
* support all js package managers ([bc2c2e2](https://github.com/sandworm-hq/audit/commit/bc2c2e2e1f7b3306314184eee8a9c77c05099f6a))
* support json stringified licence data ([fff0585](https://github.com/sandworm-hq/audit/commit/fff0585592943978036310791177d2f47d514901))
* support yarn audit ([5c701b1](https://github.com/sandworm-hq/audit/commit/5c701b15d69373f81536f1835ef43e02a093e66c))
* universal support for license info ([6b8817f](https://github.com/sandworm-hq/audit/commit/6b8817f44ba2a0b50bf743aad12b71a21c3b85cd))
* update max depth arg type ([aac673a](https://github.com/sandworm-hq/audit/commit/aac673ac41d9e6654b055d39ae0c1c1ecbde6ed6))
* update package name ([baa9281](https://github.com/sandworm-hq/audit/commit/baa9281e37d9fb5169b74886bb94ed95541020d1))


### Bug Fixes

* crash for undefined dependencyVulnerabilities ([1214155](https://github.com/sandworm-hq/audit/commit/1214155f9c499898cccca66c9e663b5d84d7e4aa))
* crash when audit returns empty ([996c5b8](https://github.com/sandworm-hq/audit/commit/996c5b8004deb66f8e8e4965db2ce9e54f33cd64))
* crash when post-processing empty graphs ([9bddc17](https://github.com/sandworm-hq/audit/commit/9bddc170e8678b51a50618bf7481464e91c9361a))
* crash when using pnpm with no dependencies ([dc4696b](https://github.com/sandworm-hq/audit/commit/dc4696bcf9bea203c2b2f71cf1108a04cee6c117))
* generate multiple charts in the same session ([552f446](https://github.com/sandworm-hq/audit/commit/552f446fd6c70217b8c53acffa0d99526727bd0e))
* include recommendations in license issue output ([c23b5ee](https://github.com/sandworm-hq/audit/commit/c23b5ee8171f6ef6f158f8d5c95b8d5d9e125e3b))
* json license data parsing ([c625d06](https://github.com/sandworm-hq/audit/commit/c625d06942ff59464e519e73244a8f0fdd66cb81))
* long license strings now truncated in tooltip ([50b0403](https://github.com/sandworm-hq/audit/commit/50b0403976f433630e9a9f96698522da5a21450b))
* parsing vulnerabilities from empty response ([813ceba](https://github.com/sandworm-hq/audit/commit/813ceba51c7786e662d73e8c7dd91f20d9905488))
* remove package lock ([98bbdf5](https://github.com/sandworm-hq/audit/commit/98bbdf526e7ef67f326f4575f515bc6b1ce0d526))
* represent non-prod dependencies ([5e04c15](https://github.com/sandworm-hq/audit/commit/5e04c1598f98e28f7db6d56f5e79c22bffee8f20))
* root vulnerabilities access ([1c39fab](https://github.com/sandworm-hq/audit/commit/1c39fab1863c5d7bad8955bf4202aa147af7983c))
* treemap now represents root module sizes ([958e7b0](https://github.com/sandworm-hq/audit/commit/958e7b07809e38b8d1240584b3e46760b65df475))

## [1.18.0](https://github.com/sandworm-hq/sandworm/compare/sandworm-v1.17.2...sandworm-v1.18.0) (2023-02-10)


### Features

* add config to disable size scanning ([88dda72](https://github.com/sandworm-hq/sandworm/commit/88dda724d6296ca6c7ca9aed49389750bd3f751d))
* add license info to tooltip, when available ([291991c](https://github.com/sandworm-hq/sandworm/commit/291991cb5cfaf0bc4441211a4d5f7df4412d197d))
* allow providing custom dep graphs ([e3b4a77](https://github.com/sandworm-hq/sandworm/commit/e3b4a77a048b6828e64462b7555d8f975c23635c))
* better license usage data structure ([3e373fa](https://github.com/sandworm-hq/sandworm/commit/3e373fa41b72b2d091865ea0ffa621f2d9ab10ce))
* better package size estimation ([c98752f](https://github.com/sandworm-hq/sandworm/commit/c98752f5b7ae5ce0fcb0fb05532b37664cda1974))
* better treemap package labeling ([3bfadd7](https://github.com/sandworm-hq/sandworm/commit/3bfadd7a0a17e7950009985c06b8f66216fae4e4))
* better vulnerability reporting ([e33941e](https://github.com/sandworm-hq/sandworm/commit/e33941eb27276c9a780489e5672e123f55459cd2))
* better vulnerability reporting ([976dad6](https://github.com/sandworm-hq/sandworm/commit/976dad6486bdb75587715b433bd8f4bcbd12ff06))
* build all charts by default ([a1db19a](https://github.com/sandworm-hq/sandworm/commit/a1db19ad97b747989c078be109643eefc1f1e889))
* charts now display license issues ([9b38f08](https://github.com/sandworm-hq/sandworm/commit/9b38f089b624faf9dad4869a4b39d13501edb797))
* cli now displays licence scanning phase ([b5467f8](https://github.com/sandworm-hq/sandworm/commit/b5467f8ab633fdee45f32d81db798943e8a1b113))
* configurable min severity level for charts ([2950408](https://github.com/sandworm-hq/sandworm/commit/2950408da998eb294e6a37d105cc1d1d7bb79ddc))
* expose array with processed dependency data ([557cfe4](https://github.com/sandworm-hq/sandworm/commit/557cfe41710e9c651fe0489dc3785a8e2572c0da))
* icon now represents severity in node tooltip ([8ccfb97](https://github.com/sandworm-hq/sandworm/commit/8ccfb97e99c69ec2c622850b7d4c0101a0c1fb64))
* include license issue recommendations ([f2af2f4](https://github.com/sandworm-hq/sandworm/commit/f2af2f4c950e9739ff0a617d0eb727dfdae53203))
* include vulnerabilities in exported data ([2528072](https://github.com/sandworm-hq/sandworm/commit/2528072c04d329cc9647c305d3f4f1f008e2cf32))
* initial commit ([f46ae74](https://github.com/sandworm-hq/sandworm/commit/f46ae749dbb3dee41d79099004cb521387e26415))
* output all dependency data as csv ([eb92647](https://github.com/sandworm-hq/sandworm/commit/eb9264766631ef3c17a8c64cbde72b7ca66b8b90))
* output license usage and issues ([99aa988](https://github.com/sandworm-hq/sandworm/commit/99aa988001b22c64313fd5f28231a1401c539a90))
* remove svg width and height attributes ([b9e3d45](https://github.com/sandworm-hq/sandworm/commit/b9e3d45020996ed91a8cdc9d81c71d28ca2b91f0))
* support all js package managers ([bc2c2e2](https://github.com/sandworm-hq/sandworm/commit/bc2c2e2e1f7b3306314184eee8a9c77c05099f6a))
* support json stringified licence data ([fff0585](https://github.com/sandworm-hq/sandworm/commit/fff0585592943978036310791177d2f47d514901))
* support yarn audit ([5c701b1](https://github.com/sandworm-hq/sandworm/commit/5c701b15d69373f81536f1835ef43e02a093e66c))
* universal support for license info ([6b8817f](https://github.com/sandworm-hq/sandworm/commit/6b8817f44ba2a0b50bf743aad12b71a21c3b85cd))
* update max depth arg type ([aac673a](https://github.com/sandworm-hq/sandworm/commit/aac673ac41d9e6654b055d39ae0c1c1ecbde6ed6))
* update package name ([baa9281](https://github.com/sandworm-hq/sandworm/commit/baa9281e37d9fb5169b74886bb94ed95541020d1))


### Bug Fixes

* crash for undefined dependencyVulnerabilities ([1214155](https://github.com/sandworm-hq/sandworm/commit/1214155f9c499898cccca66c9e663b5d84d7e4aa))
* crash when audit returns empty ([996c5b8](https://github.com/sandworm-hq/sandworm/commit/996c5b8004deb66f8e8e4965db2ce9e54f33cd64))
* crash when post-processing empty graphs ([9bddc17](https://github.com/sandworm-hq/sandworm/commit/9bddc170e8678b51a50618bf7481464e91c9361a))
* crash when using pnpm with no dependencies ([dc4696b](https://github.com/sandworm-hq/sandworm/commit/dc4696bcf9bea203c2b2f71cf1108a04cee6c117))
* generate multiple charts in the same session ([552f446](https://github.com/sandworm-hq/sandworm/commit/552f446fd6c70217b8c53acffa0d99526727bd0e))
* include recommendations in license issue output ([c23b5ee](https://github.com/sandworm-hq/sandworm/commit/c23b5ee8171f6ef6f158f8d5c95b8d5d9e125e3b))
* json license data parsing ([c625d06](https://github.com/sandworm-hq/sandworm/commit/c625d06942ff59464e519e73244a8f0fdd66cb81))
* long license strings now truncated in tooltip ([50b0403](https://github.com/sandworm-hq/sandworm/commit/50b0403976f433630e9a9f96698522da5a21450b))
* parsing vulnerabilities from empty response ([813ceba](https://github.com/sandworm-hq/sandworm/commit/813ceba51c7786e662d73e8c7dd91f20d9905488))
* remove package lock ([98bbdf5](https://github.com/sandworm-hq/sandworm/commit/98bbdf526e7ef67f326f4575f515bc6b1ce0d526))
* represent non-prod dependencies ([5e04c15](https://github.com/sandworm-hq/sandworm/commit/5e04c1598f98e28f7db6d56f5e79c22bffee8f20))
* root vulnerabilities access ([1c39fab](https://github.com/sandworm-hq/sandworm/commit/1c39fab1863c5d7bad8955bf4202aa147af7983c))
* treemap now represents root module sizes ([958e7b0](https://github.com/sandworm-hq/sandworm/commit/958e7b07809e38b8d1240584b3e46760b65df475))
