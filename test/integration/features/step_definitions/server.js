import {defineSupportCode} from 'cucumber';
import hapi from 'hapi';
import {World} from '../support/world';

defineSupportCode(({Before, setWorldConstructor}) => {
  setWorldConstructor(World);

  Before(function () {
    if (!this.server) {
      this.server = new hapi.Server();
      this.server.connection();

      return new Promise((resolve, reject) => {
        this.server.register({
          register: require('../../../../src/plugin'),
          options: {
            squash: false,
            deleteBranches: true,
            github: {
              token: this.githubToken
            }
          }
        }, err => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    return Promise.resolve();
  });
});
