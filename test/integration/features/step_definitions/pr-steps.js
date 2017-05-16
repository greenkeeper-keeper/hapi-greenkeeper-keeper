import {defineSupportCode} from 'cucumber';
import any from '@travi/any';
import {assert} from 'chai';
import {World} from '../support/world';
import {GREENKEEPER_INTEGRATION_GITHUB_URL, GREENKEEPER_BOT_GITHUB_URL} from '../../../../src/greenkeeper';

defineSupportCode(({Given, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  Given(/^the PR was submitted by the greenkeeper integration$/, function (callback) {
    this.prSender = GREENKEEPER_INTEGRATION_GITHUB_URL;

    callback();
  });

  Given(/^the PR was submitted by the greenkeeper legacy bot$/, function (callback) {
    this.prSender = GREENKEEPER_BOT_GITHUB_URL;

    callback();
  });

  Given('the PR was submitted by a non-greenkeeper user', function (callback) {
    this.prSender = any.url();

    callback();
  });

  Then(/^the PR is merged$/, function (callback) {
    assert.equal(this.mergeUri, '/123/merge');

    callback();
  });
});
