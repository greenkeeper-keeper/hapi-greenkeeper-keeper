import {defineSupportCode} from 'cucumber';
import {World} from '../support/world';
import {assert} from 'chai';
import {OK} from 'http-status-codes';

defineSupportCode(({When, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  When(/^the PR webhook is received$/, function () {
    return this.receiveWebhook().then(response => {
      this.serverResponse = response;
    });
  });

  Then(/^a successful response is returned$/, function (callback) {
    assert.equal(this.getResponseStatus(), OK);

    callback();
  });
});
