import {defineSupportCode} from 'cucumber';
import {assert} from 'chai';
import nock from 'nock';
import any from '@travi/any';
import {OK, METHOD_NOT_ALLOWED, INTERNAL_SERVER_ERROR} from 'http-status-codes';
import {World} from '../support/world';
import {GREENKEEPER_INTEGRATION_GITHUB_URL} from '../../../../src/greenkeeper';

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

defineSupportCode(({Before, After, Given, setWorldConstructor}) => {
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
    if (GREENKEEPER_INTEGRATION_GITHUB_URL === this.prSender) {
      githubScope
        .matchHeader('Authorization', authorizationHeader)
        .get(`/repos/${this.repoFullName}/pulls/${this.prNumber}`)
        .reply(OK, {
          url: 'https://api.github.com/123',
          user: {html_url: this.prSender || any.url()},
          number: this.prNumber,
          head: {
            sha: this.sha,
            ref: this.ref,
            repo: {
              full_name: this.repoFullName,
              name: 'temp-name',
              owner: {login: this.repoOwner}
            }
          }
        });
    }
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/search/issues?q=${encodeURIComponent(this.sha)}+type%3Apr`)
      .reply(OK, {
        items: [{
          url: 'https://api.github.com/123',
          user: {html_url: this.prSender || any.url()},
          number: this.prNumber
        }]
      });

    callback();
  });

  Given('no open PRs exist for the commit', function (callback) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/search/issues?q=${encodeURIComponent(this.sha)}+type%3Apr`)
      .reply(OK, {items: []});

    callback();
  });

  Given(/^statuses exist for the PR$/, function (callback) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/repos/${this.repoFullName}/commits/${this.ref}/status`)
      .reply(OK, {
        state: 'success'
      });

    callback();
  });

  Given(/^the PR can be merged$/, function (callback) {
    this.prProcessed = new Promise(resolve => {
      githubScope
        .matchHeader('Authorization', authorizationHeader)
        .put('/123/merge', {
          sha: this.sha,
          commit_title: `greenkeeper-keeper(pr: ${this.prNumber}): :white_check_mark:`,
          commit_message: `greenkeeper-keeper(pr: ${this.prNumber}): :white_check_mark:`,
          merge_method: this.squash ? 'squash' : 'merge'
        })
        .reply(OK, uri => {
          this.mergeUri = uri;
          resolve();
        });
    });

    callback();
  });

  Given(/^the PR can be accepted$/, function (callback) {
    this.prProcessed = new Promise(resolve => {
      githubScope
        .matchHeader('Authorization', authorizationHeader)
        .put('/123/merge', {
          sha: this.sha,
          commit_title: `greenkeeper-keeper(pr: ${this.prNumber}): :white_check_mark:`,
          commit_message: `greenkeeper-keeper(pr: ${this.prNumber}): :white_check_mark:`,
          merge_method: this.acceptType
        })
        .reply(OK, uri => {
          this.mergeUri = uri;
          resolve();
        });
    });

    callback();
  });

  Given(/^the commit statuses resolve to (.*)$/, function (status, callback) {
    this.comments = `/${any.word()}`;
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/repos/${this.repoFullName}/commits/${this.ref}/status`)
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
        .delete(`/repos/${this.repoFullName}/git/refs/heads/${this.ref}`)
        .reply(OK, resolve);
    });

    callback();
  });

  Given('the branch cannot be deleted', function (callback) {
    this.comments = `/${any.word()}`;
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .delete(`/repos/${this.repoFullName}/git/refs/heads/${this.ref}`)
      .reply(INTERNAL_SERVER_ERROR, {});
    stubTheCommentsEndpoint.call(this, githubScope, authorizationHeader);

    callback();
  });
});
