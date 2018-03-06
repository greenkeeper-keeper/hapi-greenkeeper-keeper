import {defineSupportCode} from 'cucumber';
import {assert} from 'chai';
import {ACCEPTED} from 'http-status-codes';
import {World} from '../support/world';

defineSupportCode(({When, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  When(/^the webhook is received$/, function () {
    return this.receiveWebhook({
      event: this.webhookEventName,
      action: this.webhookAction,
      prDetails: {
        sender: this.prSender,
        comments: this.comments,
        number: this.prNumber
      },
      statusEventDetails: {
        state: this.statusEventState,
        repoOwner: this.repoOwner,
        branches: this.commitBranches
      }
    }).then(response => {
      this.serverResponse = response;
    }).then(() => this.prProcessed);
  });

  Then(/^the webhook response confirms that it will be processed$/, function (callback) {
    assert.equal(this.getResponseStatus(), ACCEPTED);

    callback();
  });
});
