import {Then} from 'cucumber';
import {assert} from 'chai';

Then(/^a comment is made against the PR: (.*)$/, function (message, callback) {
  assert.isTrue((
    this.errorComment.startsWith(`:x: greenkeeper-keeper failed to merge the pull-request \n> ${message}`)
  ));

  callback();
});
