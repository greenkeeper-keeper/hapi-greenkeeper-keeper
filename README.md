# hapi-greenkeeper-keeper

hapi plugin to automatically merge and clean up passing greenkeeper PRs

<!-- status badges -->
[![Build Status](https://img.shields.io/travis/com/greenkeeper-keeper/hapi-greenkeeper-keeper.svg?style=flat&branch=master)](https://travis-ci.com/greenkeeper-keeper/hapi-greenkeeper-keeper)
[![Codecov](https://img.shields.io/codecov/c/github/greenkeeper-keeper/hapi-greenkeeper-keeper.svg?style=flat)](https://codecov.io/github/greenkeeper-keeper/hapi-greenkeeper-keeper)

## Usage

<!-- consumer badges -->
[![license](https://img.shields.io/github/license/greenkeeper-keeper/hapi-greenkeeper-keeper.svg?style=flat)](LICENSE)
[![npm](https://img.shields.io/npm/v/hapi-greenkeeper-keeper.svg?style=flat)](https://www.npmjs.com/package/hapi-greenkeeper-keeper)
![node][node-badge]
[![Snyk Vulnerabilities for npm package][snyk-badge]][snyk-link]
[![monthly downloads](https://img.shields.io/npm/dm/hapi-greenkeeper-keeper.svg?style=flat)](https://www.npmjs.com/package/hapi-greenkeeper-keeper)
[![Gitter](https://img.shields.io/gitter/room/greenkeeper-keeper/Lobby.svg?style=flat)](https://gitter.im/greenkeeper-keeper/Lobby)

This is a [hapi](https://hapijs.com/) plugin that you can load into your
[server instance](https://github.com/greenkeeper-keeper/meta#setting-up-your-own-instance).
You can either [load the plugin](https://hapijs.com/tutorials/plugins#loading-a-plugin)
yourself or use [glue](https://github.com/hapijs/glue) to compose your server
configuration for a manifest.

### Installation

```bash
$ npm install hapi-greenkeeper-keeper -S
```

### Configuration

This plugin has a few required options that you will need to pass when you load
the plugin on your server.

* __`github.token`__ _required_: a [personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)
  for the GitHub account that you intend to process greenkeeper PRs

  _Note_: the personal access token will need the `repo` and `repo:read_hooks`
  scopes in order to work properly
* __`acceptAction`__ _required_: how the contribution
  should be integrated, once accepted. Valid choices include:
  * `merge`
  * `squash`
  * `rebase`

## Contributing

<!-- contribution badges -->
[![PRs Welcome][PRs-badge]][PRs-link]
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat)](http://commitizen.github.io/cz-cli/)
![greenkeeper badge](https://badges.greenkeeper.io/greenkeeper-keeper/hapi-greenkeeper-keeper.svg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat)](https://github.com/semantic-release/semantic-release)

### Dependencies

```sh
$ nvm install
$ npm install
```

### Verification

```sh
$ npm test
```

[PRs-link]: http://makeapullrequest.com
[PRs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
[node-badge]: https://img.shields.io/node/v/@travi/javascript-scaffolder.svg

[snyk-badge]: https://img.shields.io/snyk/vulnerabilities/npm/hapi-greenkeeper-keeper

[snyk-link]: https://snyk.io/test/npm/hapi-greenkeeper-keeper
