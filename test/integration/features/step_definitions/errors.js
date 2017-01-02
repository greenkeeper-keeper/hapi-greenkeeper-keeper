import {defineSupportCode} from 'cucumber';
import {World} from '../support/world';
import {assert} from 'chai';

defineSupportCode(({Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  Then('a comment is made against the PR: {message:stringInDoubleQuotes}', function (message, callback) {
    assert.equal(this.errorComment, `:x: greenkeeper-keeper failed to merge the pull-request \n \`${message}\``);

    callback();
  });
});
