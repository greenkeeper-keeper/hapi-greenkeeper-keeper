import {defineSupportCode} from 'cucumber';
import any from '@travi/any';
import {World} from '../support/world';

defineSupportCode(({Given, setWorldConstructor}) => {
  setWorldConstructor(World);

  Given('the webhook is for a {stringInDoubleQuotes} event and a {stringInDoubleQuotes} action', function (
    event,
    action,
    callback
  ) {
    this.webhookAction = action;
    this.webhookEventName = event;

    callback();
  });

  Given('the webhook is for a status event and a {stringInDoubleQuotes} state', function (state, callback) {
    this.webhookEventName = 'status';
    this.statusEventState = state;
    this.repoOwner = any.word();

    callback();
  });
});
