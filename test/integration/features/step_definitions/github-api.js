import {defineSupportCode} from 'cucumber';
import {World} from '../support/world';
import {assert} from 'chai';
import nock from 'nock';
import {OK} from 'http-status-codes';

defineSupportCode(({Before, After, Given, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  let githubScope;

  Before(() => {
    nock.disableNetConnect();
    process.env.DELETE_BRANCHES = false;

    githubScope = nock('https://api.github.com').log(console.log);
  });

  After(() => {
    assert.isTrue(githubScope.isDone(), `pending mocks: ${githubScope.pendingMocks()}`);
    nock.enableNetConnect();
    nock.cleanAll();
  });

  Given(/^statuses exist for the PR$/, function (callback) {
    githubScope.get('/foo').reply(OK);

    callback();
  });

  Given(/^the PR can be merged$/, function (callback) {
    githubScope.delete('/repos/test-repo/git/refs/heads/baz').reply(OK);
    githubScope.put('/123/merge').reply(OK, (uri) => {
      this.mergeUri = uri;
    });

    callback();
  });

  Then(/^the PR is merged$/, function (callback) {
    assert.equal(this.mergeUri, '/123/merge');

    callback();
  });
});
