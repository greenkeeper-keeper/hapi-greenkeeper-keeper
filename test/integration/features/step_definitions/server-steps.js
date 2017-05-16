import {defineSupportCode} from 'cucumber';
import any from '@travi/any';
import hapi from 'hapi';
import {World} from '../support/world';

defineSupportCode(({Before, setWorldConstructor}) => {
  setWorldConstructor(World);

  Before(function () {
    if (!this.server) {
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
    }

    return Promise.resolve();
  });
});
