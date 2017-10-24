import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import * as clientFactory from '../../../src/github/request-methods';
import * as poll from '../../../src/github/poller';
import actionsFactory from '../../../src/github/actions';
import {
  BranchDeletionFailureError,
  FailedStatusFoundError,
  InvalidStatusFoundError,
  MergeFailureError
} from '../../../src/errors';

suite('github actions', () => {
  let actions, sandbox, get, post, put, del;
  const MINUTE = 1000 * 60;
  const githubCredentials = any.simpleObject();
  const url = any.url();
  const sha = any.string();
  const ref = any.string();
  const repoName = any.word();
  const prNumber = any.string();
  const response = {body: any.simpleObject()};
  const log = () => undefined;

  setup(() => {
    sandbox = sinon.sandbox.create();

    get = sinon.stub();
    post = sinon.stub();
    put = sinon.stub();
    del = sinon.stub();

    sandbox.stub(poll, 'default');
    sandbox.stub(clientFactory, 'default').withArgs(githubCredentials).returns({get, post, put, del});

    actions = actionsFactory(githubCredentials);
  });

  teardown(() => sandbox.restore());

  suite('ensure PR can be merged', () => {
    test('that the passing status is acceptable', () => {
      get.withArgs(`https://api.github.com/repos/${repoName}/commits/${ref}/status`).resolves({
        body: {
          state: 'success'
        }
      });

      return assert.becomes(
        actions.ensureAcceptability({repo: {full_name: repoName}, ref}, () => undefined),
        'All commit statuses passed'
      );
    });

    test('that the failing status results in rejection', () => {
      get.resolves({body: {state: 'failure'}});

      return assert.isRejected(
        actions.ensureAcceptability({repo: {full_name: repoName}, ref}, () => undefined),
        FailedStatusFoundError,
        /A failed status was found for this PR\./
      );
    });

    test('that the pending status delegates to poller', () => {
      const result = any.string();
      get.resolves({body: {state: 'pending'}});
      poll.default.withArgs({repo: {full_name: repoName}, ref, pollWhenPending: true}, log, MINUTE).resolves(result);

      return assert.becomes(
        actions.ensureAcceptability({repo: {full_name: repoName}, ref, pollWhenPending: true}, log),
        result
      );
    });

    test('that the timeout is passed along to the poller', () => {
      const timeout = any.integer();
      const result = any.string();
      get.resolves({body: {state: 'pending'}});
      poll.default.withArgs({repo: {full_name: repoName}, ref, pollWhenPending: true}, log, timeout).resolves(result);

      return assert.becomes(
        actions.ensureAcceptability({repo: {full_name: repoName}, ref, pollWhenPending: true}, log, timeout),
        result
      );
    });

    test('that the polling does not happen without the `pollWhenPending` flag', () => {
      get.resolves({body: {state: 'pending'}});

      return assert.isRejected(
        actions.ensureAcceptability({repo: {full_name: repoName}, ref}, log, any.integer()),
        'pending'
      );
    });

    test('that an invalid status results in rejection', () => {
      get.resolves({body: {state: any.string()}});

      return assert.isRejected(
        actions.ensureAcceptability({repo: {full_name: repoName}, ref}, log),
        InvalidStatusFoundError,
        /An invalid status was found for this PR\./
      );
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

      return assert.becomes(actions.acceptPR(url, sha, prNumber, squash, null, log), response);
    });

    test('that the referenced PR gets squashed when configured to do so', () => {
      const squash = true;
      put.withArgs(`${url}/merge`, {
        sha,
        commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        merge_method: 'squash'
      }).resolves(response);

      return assert.becomes(actions.acceptPR(url, sha, prNumber, squash, null, log), response);
    });

    test('that the referenced PR gets accepted', () => {
      const acceptAction = any.string();
      put.withArgs(`${url}/merge`, {
        sha,
        commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        merge_method: acceptAction
      }).resolves(response);

      return assert.becomes(actions.acceptPR(url, sha, prNumber, null, acceptAction, log), response);
    });

    test('that a merge failure is reported appropriately', () => {
      put.rejects(new Error('error from PUT request in test'));

      return assert.isRejected(
        actions.acceptPR(),
        MergeFailureError,
        /An attempt to merge this PR failed. Error: error from PUT request in test$/
      );
    });
  });

  suite('delete branch', () => {
    test('that the branch gets deleted if config is to delete', () => {
      del.withArgs(`https://api.github.com/repos/${repoName}/git/refs/heads/${ref}`).resolves(response);

      return assert.becomes(actions.deleteBranch({repo: {full_name: repoName}, ref}, true), response);
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
      );
    });
  });

  suite('comments', () => {
    test('that an error comment is posted', () => {
      const message = any.string();
      const error = new Error(message);
      post.withArgs(url, {
        body: `:x: greenkeeper-keeper failed to merge the pull-request \n> ${message}`
      }).resolves(response);

      return assert.becomes(actions.postErrorComment(url, error), response);
    });
  });

  suite('PRs for a commit', () => {
    test('that PRs with HEAD matching a commit are fetched', () => {
      const pullRequests = any.listOf(any.simpleObject);
      const ownerLogin = any.word();
      get.withArgs(`https://api.github.com/repos/${repoName}/pulls?head=${ownerLogin}:${ref}`).resolves({
        body: pullRequests
      });

      return assert.becomes(
        actions.getPullRequestsForCommit({repo: {full_name: repoName, owner: {login: ownerLogin}}, ref}),
        pullRequests
      );
    });
  });
});
