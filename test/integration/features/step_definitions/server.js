import {defineSupportCode} from 'cucumber';
import {World} from '../support/world';
import hapi from 'hapi';

defineSupportCode(({Before, setWorldConstructor}) => {
  setWorldConstructor(World);

  Before(function () {
    if (!this.server) {
      this.server = new hapi.Server();
      this.server.connection();

      return new Promise((resolve, reject) => {
        this.server.register(require('../../../../src/plugin'), err => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    return Promise.resolve();
  })
});
