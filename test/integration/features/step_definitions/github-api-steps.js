import {defineSupportCode} from 'cucumber';
import {assert} from 'chai';
import nock from 'nock';
import any from '@travi/any';
import {METHOD_NOT_ALLOWED, OK} from 'http-status-codes';
import {World} from '../support/world';
import {GREENKEEPER_INTEGRATION_GITHUB_URL} from '../../../../src/greenkeeper';

const debug = require('debug')('test');

function stubTheCommentsEndpoint(githubScope, authorizationHeader) {
  this.prProcessed = new Promise(resolve => {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .post(`/repos/${this.repoFullName}/issues/${this.prNumber}/comments`)
      .reply(OK, (uri, requestBody) => {
        this.errorComment = JSON.parse(requestBody).body;
        resolve();
      });
  });
}

function stubTheStatusesEndpoint(githubScope, authorizationHeader, status) {
  githubScope
    .matchHeader('Authorization', authorizationHeader)
    .get(`/repos/${this.repoFullName}/commits/${this.sha}/status`)
    .reply(OK, {
      state: status
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

  Given(/^an open PR exists for the commit$/, function (callback) {
    this.prLink = 'https://api.github.com/123';

    if (GREENKEEPER_INTEGRATION_GITHUB_URL === this.prSender) {
      githubScope
        .matchHeader('Authorization', authorizationHeader)
        .get(`/repos/${this.repoFullName}/pulls/${this.prNumber}`)
        .reply(OK, {
          url: this.prLink,
          user: {html_url: this.prSender || any.url()},
          number: this.prNumber,
          head: {
            sha: this.sha,
            ref: this.ref,
            repo: {
              full_name: this.repoFullName,
              name: this.repoName,
              owner: {login: this.repoOwner}
            }
          }
        });
    }

    if ('status' === this.webhookEventName) {
      githubScope
        .matchHeader('Authorization', authorizationHeader)
        .get(`/search/issues?q=${this.sha}+type%3Apr`)
        .reply(OK, {
          items: [{
            url: this.prLink,
            user: {html_url: this.prSender || any.url()},
            number: this.prNumber
          }]
        });
    }

    callback();
  });

  Given(/^no open PRs exist for the commit$/, function (callback) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .get(`/search/issues?q=${encodeURIComponent(this.sha)}+type%3Apr`)
      .reply(OK, {items: []});

    callback();
  });

  Given(/^the commit statuses resolve to (.*)$/, function (status) {
    stubTheStatusesEndpoint.call(this, githubScope, authorizationHeader, status);

    if ('failure' === status) {
      stubTheCommentsEndpoint.call(this, githubScope, authorizationHeader);
    }
  });

  Given(/^the check_run results resolve to (.*)$/, function (status) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      // .matchHeader('Accept', 'application/vnd.github.antiope-preview+json')
      .get(`/repos/${this.repoFullName}/commits/${this.sha}/check-runs`)
      .reply(OK, {
        state: status
      });
  });

  Given(/^the PR can be merged$/, function (callback) {
    this.prProcessed = new Promise(resolve => {
      githubScope
        .matchHeader('Authorization', authorizationHeader)
        .put(`/repos/${this.repoFullName}/pulls/${this.prNumber}/merge`, {
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
        .put(`/repos/${this.repoFullName}/pulls/${this.prNumber}/merge`, {
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

  Given(/^the PR cannot be merged$/, function (callback) {
    githubScope
      .matchHeader('Authorization', authorizationHeader)
      .put(`/repos/${this.repoFullName}/pulls/${this.prNumber}/merge`)
      .reply(METHOD_NOT_ALLOWED, {
        message: 'Pull Request is not mergeable',
        documentation_url: 'https://developer.github.com/v3/pulls/#merge-a-pull-request-merge-button'
      });
    stubTheCommentsEndpoint.call(this, githubScope, authorizationHeader);

    callback();
  });
});
