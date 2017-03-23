import {defineSupportCode} from 'cucumber';
import {assert} from 'chai';
import {ACCEPTED, BAD_REQUEST} from 'http-status-codes';
import {World} from '../support/world';

defineSupportCode(({When, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  When(/^the PR webhook is received$/, function () {
    return this.receiveWebhook({
      event: this.webhookEventName,
      action: this.webhookAction,
      prDetails: {
        sender: this.prSender,
        comments: this.comments
      },
      statusEventDetails: {
        state: this.statusEventState,
        repoOwner: this.repoOwner
      }
    }).then(response => {
      this.serverResponse = response;
    }).then(() => this.prProcessed);
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
