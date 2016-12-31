import {defineSupportCode} from 'cucumber';
import {World} from '../support/world';
import {assert} from 'chai';
import {ACCEPTED} from 'http-status-codes';

defineSupportCode(({When, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  When(/^the PR webhook is received$/, function () {
    return this.receiveWebhook().then(response => {
      this.serverResponse = response;
    });
  });

  Then(/^the webhook response confirms that it will be processed$/, function (callback) {
    assert.equal(this.getResponseStatus(), ACCEPTED);

    callback();
  });
});
