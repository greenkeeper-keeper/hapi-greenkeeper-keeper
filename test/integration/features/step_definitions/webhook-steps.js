import {defineSupportCode} from 'cucumber';
import any from '@travi/any';
import {assert} from 'chai';
import {BAD_REQUEST} from 'http-status-codes';
import {World} from '../support/world';

defineSupportCode(({Given, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  Given(/^the webhook is for a (.*) event and a (.*) action$/, function (
    event,
    action,
    callback
  ) {
    this.webhookAction = action;
    this.webhookEventName = event;

    callback();
  });

  Given(/^the webhook is for a status event and a (.*) state$/, function (state, callback) {
    this.webhookEventName = 'status';
    this.statusEventState = state;
    this.repoOwner = any.word();

    callback();
  });

  Given('the commit is only on one, non-master branch', function (callback) {
    this.commitBranches = [any.word()];

    callback();
  });

  Given('the commit is on multiple branches', function (callback) {
    this.commitBranches = [any.word(), any.word()];

    callback();
  });

  Given('the commit is on the master branch', function (callback) {
    this.commitBranches = ['master'];

    callback();
  });

  Then('the webhook response indicates that the webhook will be skipped', function (callback) {
    assert.equal(this.getResponseStatus(), BAD_REQUEST);

    callback();
  });
});
