import {defineSupportCode} from 'cucumber';
import any from '@travi/any';
import hapi from 'hapi';
import {World} from '../support/world';

defineSupportCode(({After, Given, setWorldConstructor}) => {
  setWorldConstructor(World);

  After(function () {
    return this.server.stop();
  });

  Given(/^the server is configured$/, async function () {
    this.server = new hapi.Server();
    this.acceptType = any.fromList(['merge', 'squash', 'rebase']);

    return this.server.register([
      {
        plugin: require('../../../../src/plugin'),
        options: {
          acceptAction: this.acceptType,
          github: {
            token: this.githubToken
          }
        }
      },
      {
        plugin: require('good'),
        options: {
          reporters: {
            console: [
              {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{log: '*', request: '*', response: '*', error: '*'}]
              },
              {module: 'good-console'},
              'stdout'
            ]
          }
        }
      }
    ]);
  });

  Given(/^the server is configured using the squash flag$/, async function () {
    this.server = new hapi.Server();
    this.squash = any.boolean();

    return this.server.register([
      {
        plugin: require('../../../../src/plugin'),
        options: {
          squash: this.squash,
          deleteBranches: true,
          github: {
            token: this.githubToken
          }
        }
      },
      {
        plugin: require('good'),
        options: {
          reporters: {
            console: [
              {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{log: '*', request: '*', response: '*', error: '*'}]
              },
              {module: 'good-console'},
              'stdout'
            ]
          }
        }
      }
    ]);
  });
});
