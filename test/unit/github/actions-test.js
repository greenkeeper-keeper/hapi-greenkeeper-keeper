import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import * as clientFactory from '../../../src/github/request-methods';
import * as poll from '../../../src/github/poller';
import * as octokitFactory from '../../../src/github/octokit-factory-wrapper';
import actionsFactory from '../../../src/github/actions';
import {
  BranchDeletionFailureError,
  FailedStatusFoundError,
  InvalidStatusFoundError,
  MergeFailureError
} from '../../../src/errors';

suite('github actions', () => {
  let
    sandbox,
    actions,
    post,
    put,
    del,
    octokitAuthenticate,
    octokitIssueSearch,
    octokitGetPr,
    octokitCombinedStatus;
  const MINUTE = 1000 * 60;
  const token = any.simpleObject();
  const githubCredentials = {...any.simpleObject(), token};
  const url = any.url();
  const sha = any.string();
  const ref = any.string();
  const repoOwner = any.word();
  const repoName = any.word();
  const repo = {name: repoName, owner: {login: repoOwner}};
  const prNumber = any.string();
  const response = {body: any.simpleObject()};
  const log = () => undefined;

  setup(() => {
    sandbox = sinon.sandbox.create();

    post = sinon.stub();
    put = sinon.stub();
    del = sinon.stub();
    octokitAuthenticate = sinon.spy();
    octokitIssueSearch = sinon.stub();
    octokitGetPr = sinon.stub();
    octokitCombinedStatus = sinon.stub();

    sandbox.stub(octokitFactory, 'default');
    sandbox.stub(poll, 'default');
    sandbox.stub(clientFactory, 'default').withArgs(githubCredentials).returns({post, put, del});

    octokitFactory.default.returns({
      authenticate: octokitAuthenticate,
      search: {issues: octokitIssueSearch},
      pullRequests: {get: octokitGetPr},
      repos: {getCombinedStatusForRef: octokitCombinedStatus}
    });
    actions = actionsFactory(githubCredentials);
  });

  teardown(() => sandbox.restore());

  const assertAuthenticatedForOctokit = () => assert.calledWith(octokitAuthenticate, {type: 'token', token});

  suite('ensure PR can be merged', () => {
    test('that the passing status is acceptable', () => {
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'success'}});

      return assert.becomes(
        actions.ensureAcceptability({repo, sha}, () => undefined),
        'All commit statuses passed'
      ).then(assertAuthenticatedForOctokit);
    });

    test('that the failing status results in rejection', () => {
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'failure'}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, () => undefined),
        FailedStatusFoundError,
        /A failed status was found for this PR\./
      ).then(assertAuthenticatedForOctokit);
    });

    test('that the pending status delegates to poller', () => {
      const result = any.string();
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'pending'}});
      poll.default.withArgs({repo, sha, pollWhenPending: true}, log, MINUTE).resolves(result);

      return assert.becomes(
        actions.ensureAcceptability({repo, sha, pollWhenPending: true}, log),
        result
      ).then(assertAuthenticatedForOctokit);
    });

    test('that the timeout is passed along to the poller', () => {
      const timeout = any.integer();
      const result = any.string();
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'pending'}});
      poll.default.withArgs({repo, sha, pollWhenPending: true}, log, timeout).resolves(result);

      return assert.becomes(
        actions.ensureAcceptability({repo, sha, pollWhenPending: true}, log, timeout),
        result
      ).then(assertAuthenticatedForOctokit);
    });

    test('that the polling does not happen without the `pollWhenPending` flag', () => {
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'pending'}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, log, any.integer()),
        'pending'
      ).then(assertAuthenticatedForOctokit);
    });

    test('that an invalid status results in rejection', () => {
      octokitCombinedStatus
        .withArgs({owner: repoOwner, repo: repoName, ref: sha})
        .resolves({data: {state: any.string()}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, log),
        InvalidStatusFoundError,
        /An invalid status was found for this PR\./
      ).then(assertAuthenticatedForOctokit);
    });
  });

  suite('accept PR', () => {
    test('that the referenced PR gets merged', () => {
      const squash = false;
      put.withArgs(`${url}/merge`, {
        sha,
        commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        merge_method: 'merge'
      }).resolves(response);

      return assert.becomes(actions.acceptPR(url, sha, prNumber, squash, null, log), response)
        .then(assertAuthenticatedForOctokit);
    });

    test('that the referenced PR gets squashed when configured to do so', () => {
      const squash = true;
      put.withArgs(`${url}/merge`, {
        sha,
        commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        merge_method: 'squash'
      }).resolves(response);

      return assert.becomes(actions.acceptPR(url, sha, prNumber, squash, null, log), response)
        .then(assertAuthenticatedForOctokit);
    });

    test('that the referenced PR gets accepted', () => {
      const acceptAction = any.string();
      put.withArgs(`${url}/merge`, {
        sha,
        commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        merge_method: acceptAction
      }).resolves(response);

      return assert.becomes(actions.acceptPR(url, sha, prNumber, null, acceptAction, log), response)
        .then(assertAuthenticatedForOctokit);
    });

    test('that a merge failure is reported appropriately', () => {
      put.rejects(new Error('error from PUT request in test'));

      return assert.isRejected(
        actions.acceptPR(),
        MergeFailureError,
        /An attempt to merge this PR failed. Error: error from PUT request in test$/
      ).then(assertAuthenticatedForOctokit);
    });
  });

  suite('delete branch', () => {
    test('that the branch gets deleted if config is to delete', () => {
      del.withArgs(`https://api.github.com/repos/${repoName}/git/refs/heads/${ref}`).resolves(response);

      return assert.becomes(actions.deleteBranch({repo: {full_name: repoName}, ref}, true), response)
        .then(assertAuthenticatedForOctokit);
    });

    test('that the branch is not deleted if the config is not to delete', () => {
      actions.deleteBranch({}, false).then(() => assert.notCalled(del));
    });

    test('that a failure to delete the branch is reported appropriately', () => {
      del.rejects(new Error('error from DELETE request in test'));

      return assert.isRejected(
        actions.deleteBranch({repo: {full_name: repoName}, ref}, true),
        BranchDeletionFailureError,
        /An attempt to delete this branch failed. Error: error from DELETE request in test$/
      ).then(assertAuthenticatedForOctokit);
    });
  });

  suite('comments', () => {
    test('that an error comment is posted', () => {
      const message = any.string();
      const error = new Error(message);
      post.withArgs(url, {
        body: `:x: greenkeeper-keeper failed to merge the pull-request \n> ${message}`
      }).resolves(response);

      return assert.becomes(actions.postErrorComment(url, error), response).then(assertAuthenticatedForOctokit);
    });
  });

  suite('PRs for a commit', () => {
    test('that PRs with HEAD matching a commit are fetched', () => {
      const pullRequests = any.listOf(any.simpleObject);
      octokitIssueSearch.withArgs({q: `${ref}+type:pr`}).returns({data: {items: pullRequests}});

      return assert.becomes(actions.getPullRequestsForCommit({ref}), pullRequests).then(assertAuthenticatedForOctokit);
    });
  });

  test('that the PR gets requested by issue number', () => {
    const pullRequest = any.simpleObject();
    octokitGetPr.withArgs({owner: repoOwner, repo: repoName, number: prNumber}).resolves({data: pullRequest});

    return assert.becomes(actions.getPullRequest(repo, prNumber), pullRequest);
  });
});
