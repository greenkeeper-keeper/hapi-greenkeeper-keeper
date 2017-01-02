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
