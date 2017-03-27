import {defineSupportCode} from 'cucumber';
import {assert} from 'chai';
import nock from 'nock';
import any from '@travi/any';
import {OK, METHOD_NOT_ALLOWED, INTERNAL_SERVER_ERROR} from 'http-status-codes';
import {World} from '../support/world';

const debug = require('debug')('test');

function stubTheCommentsEndpoint(githubScope, authorizationHeader) {
  this.prProcessed = new Promise(resolve => {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .post(this.comments)
      .reply(OK, (uri, requestBody) => {
        this.errorComment = JSON.parse(requestBody).body;
        resolve();
      });
  });
}

defineSupportCode(({Before, After, Given, Then, setWorldConstructor}) => {
  setWorldConstructor(World);

  let githubScope, authorizationHeader;

  Before(function () {
    nock.disableNetConnect();
    process.env.DELETE_BRANCHES = false;

    authorizationHeader = `token ${this.githubToken}`;

    githubScope = nock('https://api.github.com').log(debug);
  });

  After(() => {
    assert.isTrue(githubScope.isDone(), `pending mocks: ${githubScope.pendingMocks()}`);
    nock.enableNetConnect();
    nock.cleanAll();
  });

  Given('an open PR exists for the commit', function (callback) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/repos/${this.repo}/pulls?head=${this.repoOwner}:${this.commitBranches[0]}`)
      .reply(OK, [{
        user: {html_url: any.url()}
      }]);

    callback();
  });

  Given('no open PRs exist for the commit', function (callback) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/repos/${this.repo}/pulls?head=${this.repoOwner}:${this.commitBranches[0]}`)
      .reply(OK, []);

    callback();
  });

  Given(/^statuses exist for the PR$/, function (callback) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/repos/${this.repo}/commits/${this.ref}/status`)
      .reply(OK, {
        state: 'success'
      });

    callback();
  });

  Given(/^the PR can be merged$/, function (callback) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .put('/123/merge')
      .reply(OK, uri => {
        this.mergeUri = uri;
      });

    callback();
  });

  Given('the commit statuses resolve to {stringInDoubleQuotes}', function (status, callback) {
    this.comments = `/${any.word()}`;
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/repos/${this.repo}/commits/${this.ref}/status`)
      .reply(OK, {
        state: status
      });
    stubTheCommentsEndpoint.call(this, githubScope, authorizationHeader);

    callback();
  });

  Given('the PR cannot be merged', function (callback) {
    this.comments = `/${any.word()}`;
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .put('/123/merge')
      .reply(METHOD_NOT_ALLOWED, {
        message: 'Pull Request is not mergeable',
        documentation_url: 'https://developer.github.com/v3/pulls/#merge-a-pull-request-merge-button'
      });
    stubTheCommentsEndpoint.call(this, githubScope, authorizationHeader);

    callback();
  });

  Given('the branch can be deleted', function (callback) {
    this.prProcessed = new Promise(resolve => {
      githubScope
        .matchHeader('Authorization', authorizationHeader)
        .delete(`/repos/${this.repo}/git/refs/heads/${this.ref}`)
        .reply(OK, resolve);
    });

    callback();
  });

  Given('the branch cannot be deleted', function (callback) {
    this.comments = `/${any.word()}`;
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .delete(`/repos/${this.repo}/git/refs/heads/${this.ref}`)
      .reply(INTERNAL_SERVER_ERROR, {});
    stubTheCommentsEndpoint.call(this, githubScope, authorizationHeader);

    callback();
  });

  Then(/^the PR is merged$/, function (callback) {
    assert.equal(this.mergeUri, '/123/merge');

    callback();
  });
});
