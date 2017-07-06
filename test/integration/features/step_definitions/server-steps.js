import {defineSupportCode} from 'cucumber';
import any from '@travi/any';
import hapi from 'hapi';
import {World} from '../support/world';

defineSupportCode(({Given, setWorldConstructor}) => {
  setWorldConstructor(World);

  Given(/^the server is configured$/, function () {
    this.server = new hapi.Server();
    this.server.connection();
    this.acceptType = any.fromList(['merge', 'squash', 'rebase']);

    return new Promise((resolve, reject) => {
      this.server.register([
        {
          register: require('../../../../src/plugin'),
          options: {
            acceptAction: this.acceptType,
            deleteBranches: true,
            github: {
              token: this.githubToken
            }
          }
        },
        {
          register: require('good'),
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
      ], err => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  Given(/^the server is configured using the squash flag$/, function () {
    this.server = new hapi.Server();
    this.server.connection();
    this.squash = any.boolean();

    return new Promise((resolve, reject) => {
      this.server.register([
        {
          register: require('../../../../src/plugin'),
          options: {
            squash: this.squash,
            deleteBranches: true,
            github: {
              token: this.githubToken
            }
          }
        },
        {
          register: require('good'),
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
      ], err => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
});
