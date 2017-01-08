import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import * as clientFactory from '../../../src/github/request-methods';
import * as poll from '../../../src/github/poller';
import actionsFactory from '../../../src/github/actions';
import FailedStatusFoundError from '../../../src/failed-status-found-error';

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
        actions.ensureAcceptability({repo: {full_name: repoName}, ref}),
        'All commit statuses passed'
      );
    });

    test('that the failing status results in rejection', () => {
      get.resolves({body: {state: 'failure'}});

      return assert.isRejected(
        actions.ensureAcceptability({repo: {full_name: repoName}, ref}),
        FailedStatusFoundError,
        /A failed status was found for this PR\./
      );
    });

    test('that the pending status delegates to poller', () => {
      const result = any.string();
      get.resolves({body: {state: 'pending'}});
      poll.default.withArgs({repo: {full_name: repoName}, ref}, MINUTE).resolves(result);

      return assert.becomes(actions.ensureAcceptability({repo: {full_name: repoName}, ref}), result);
    });

    test('that the timeout is passed along to the poller', () => {
      const timeout = any.integer();
      const result = any.string();
      get.resolves({body: {state: 'pending'}});
      poll.default.withArgs({repo: {full_name: repoName}, ref}, timeout).resolves(result);

      return assert.becomes(actions.ensureAcceptability({repo: {full_name: repoName}, ref}, timeout), result);
    });
  });

  suite('accept PR', () => {
    test('that the referenced PR gets merged', () => {
      put.withArgs(`${url}/merge`, {
        sha,
        commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        squash: false
      }).resolves(response);

      return assert.becomes(actions.acceptPR(url, sha, prNumber), response);
    });

    test('that the referenced PR gets squashed and merged', () => {
      put.withArgs(`${url}/merge`, sinon.match({squash: true})).resolves(response);

      return assert.becomes(actions.acceptPR(url, sha, prNumber, true), response);
    });
  });

  suite('delete branch', () => {
    test('that the branch gets deleted if config is to delete', () => {
      del.withArgs(`https://api.github.com/repos/${repoName}/git/refs/heads/${ref}`).resolves(response);

      return assert.becomes(actions.deleteBranch({repo: {full_name: repoName}, ref}, true), response);
    });

    test('that the branch is not deleted if the config is not to delete', () => {
      return actions.deleteBranch({}, false).then(() => assert.notCalled(del));
    });
  });

  suite('comments', () => {
    test('that an error comment is posted', () => {
      const message = any.string();
      const error = new Error(message);
      post.withArgs(url, {
        body: `:x: greenkeeper-keeper failed to merge the pull-request \n \`${message}\``
      }).resolves(response);

      return assert.becomes(actions.postErrorComment(url, error), response);
    });
  });
});
