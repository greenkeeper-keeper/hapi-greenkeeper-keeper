import {setWorldConstructor, Then, When} from 'cucumber';
import {assert} from 'chai';
import {ACCEPTED} from 'http-status-codes';
import {World} from '../support/world';

setWorldConstructor(World);

When(/^the webhook is received$/, function () {
  return this.receiveWebhook({
    event: this.webhookEventName,
    action: this.webhookAction,
    statusEventDetails: {
      state: this.statusEventState,
      repoOwner: this.repoOwner,
      branches: this.commitBranches
    },
    checkRunEventDetails: {
      status: this.checkRunEventStatus,
      conclusion: this.checkRunEventConclusion,
      repoOwner: this.repoOwner,
      prLink: this.prLink,
      prNumber: this.prNumber,
      ...this.commitBranches && {branch: this.commitBranches[0]}
    }
  }).then(response => {
    this.serverResponse = response;
  }).then(() => this.prProcessed);
});

Then(/^the webhook response confirms that it will be processed$/, function (callback) {
  assert.equal(this.getResponseStatus(), ACCEPTED);

  callback();
});
