import {defineSupportCode} from 'cucumber';
import {World} from '../support/world';
import {assert} from 'chai';
import {ACCEPTED, BAD_REQUEST} from 'http-status-codes';

defineSupportCode(({When, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  When(/^the PR webhook is received$/, function () {
    return this.receiveWebhook({
      event: this.webhookEventName,
      action: this.webhookAction,
      sender: this.prSender
    }).then(response => {
      this.serverResponse = response;
    });
  });

  Then(/^the webhook response confirms that it will be processed$/, function (callback) {
    assert.equal(this.getResponseStatus(), ACCEPTED);

    callback();
  });

  Then('the webhook response indicates that the PR will be skipped', function (callback) {
    assert.equal(this.getResponseStatus(), BAD_REQUEST);

    callback();
  });
});
