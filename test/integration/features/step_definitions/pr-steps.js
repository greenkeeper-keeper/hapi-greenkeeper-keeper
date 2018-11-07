import {defineSupportCode} from 'cucumber';
import any from '@travi/any';
import {assert} from 'chai';
import {World} from '../support/world';
import {GREENKEEPER_INTEGRATION_GITHUB_URL} from '../../../../src/greenkeeper';

defineSupportCode(({Given, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  Given(/^the PR was submitted by the greenkeeper integration$/, function (callback) {
    this.prSender = GREENKEEPER_INTEGRATION_GITHUB_URL;

    callback();
  });

  Given(/^the PR was submitted by a non-greenkeeper user$/, function (callback) {
    this.prSender = any.url();

    callback();
  });

  Then(/^the PR is merged$/, function (callback) {
    assert.equal(this.mergeUri, `/repos/${this.repoFullName}/pulls/${this.prNumber}/merge`);

    callback();
  });

  Then(/^the PR is not merged$/, async function () {
    // passes because there are no pending required requests, like posting a comment due to an error
  });
});
