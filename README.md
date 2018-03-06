# hapi-greenkeeper-keeper

hapi plugin to automatically merge and clean up passing greenkeeper PRs

[![npm](https://img.shields.io/npm/v/hapi-greenkeeper-keeper.svg?maxAge=2592000)](https://www.npmjs.com/package/hapi-greenkeeper-keeper)
[![license](https://img.shields.io/github/license/greenkeeper-keeper/hapi-greenkeeper-keeper.svg)](LICENSE)
[![Gitter](https://img.shields.io/gitter/room/greenkeeper-keeper/Lobby.svg)](https://gitter.im/greenkeeper-keeper/Lobby)

[![Build Status](https://img.shields.io/travis/greenkeeper-keeper/hapi-greenkeeper-keeper.svg?style=flat&branch=master)](https://travis-ci.org/greenkeeper-keeper/hapi-greenkeeper-keeper)
[![Codecov](https://img.shields.io/codecov/c/github/greenkeeper-keeper/hapi-greenkeeper-keeper.svg)](https://codecov.io/github/greenkeeper-keeper/hapi-greenkeeper-keeper)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![greenkeeper badge](https://badges.greenkeeper.io/greenkeeper-keeper/hapi-greenkeeper-keeper.svg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![PRs Welcome][prs-badge]][prs]

## Installation

```bash
$ npm install hapi-greenkeeper-keeper -S
```

## Usage

This is a [hapi](https://hapijs.com/) plugin that you can load into your
[server instance](https://github.com/greenkeeper-keeper/meta#setting-up-your-own-instance).
You can either [load the plugin](https://hapijs.com/tutorials/plugins#loading-a-plugin)
yourself or use [glue](https://github.com/hapijs/glue) to compose your server
configuration for a manifest.

### Configuration

This plugin has a few required options that you will need to pass when you load
the plugin on your server.

* __`github.token`__ _required_: a [personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)
  for the GitHub account that you intend to process greenkeeper PRs

  _Note_: the personal access token will need the `repo` and `repo:read_hooks`
  scopes in order to work properly
* __`squash`__ _deprecated_: whether or not you want the commits on the branch
  squashed before merging
* __`acceptType`__ _required if `squash` is not provided_: how the contribution
  should be integrated, once accepted. Valid choices include:
  * `merge`
  * `squash`
  * `rebase`
* __`deleteBranches`__ _defaults to `false`_: whether or not you want
  greenkeeper-keeper to delete branches for merged PRs

  _Note_: if you are using the new GitHub integration version of Greenkeeper,
  branches are already deleted automatically

[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
