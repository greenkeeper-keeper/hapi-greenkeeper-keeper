import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import * as clientFactory from '../../../src/github/request-methods';
import actionsFactory from '../../../src/github/actions';

suite('github actions', () => {
  let actions, sandbox, get, post, put, del;
  const githubCredentials = any.simpleObject();
  const url = any.url();
  const sha = any.string();
  const prNumber = any.string();
  const response = any.simpleObject();

  setup(() => {
    sandbox = sinon.sandbox.create();

    get = sinon.stub();
    post = sinon.stub();
    put = sinon.stub();
    del = sinon.stub();

    sandbox.stub(clientFactory, 'default').withArgs(githubCredentials).returns({get, post, put, del});

    actions = actionsFactory(githubCredentials);
  });

  teardown(() => sandbox.restore());

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
      const ref = any.string();
      const repoName = any.word();
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
