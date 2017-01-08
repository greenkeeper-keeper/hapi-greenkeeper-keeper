import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import processPR from '../../src/process';
import * as actionsFactory from '../../src/github/actions';

suite('process', () => {
  let sandbox, acceptPR, deleteBranch, postErrorComment, ensureAcceptability;
  const githubCredentials = any.simpleObject();
  const url = any.url();
  const sha = any.string();
  const ref = any.string();
  const head = {sha, ref};
  const number = any.integer();
  const squash = any.boolean();
  const deleteBranches = any.boolean();

  setup(() => {
    sandbox = sinon.sandbox.create();

    ensureAcceptability = sinon.stub();
    acceptPR = sinon.stub();
    deleteBranch = sinon.stub();
    postErrorComment = sinon.stub();

    sandbox.stub(actionsFactory, 'default').withArgs(githubCredentials).returns({
      ensureAcceptability,
      acceptPR,
      deleteBranch,
      postErrorComment
    });
  });

  teardown(() => sandbox.restore());

  test('that processing a greenkeeper PR confirms that it can be merged, merges, and deletes the branch', () => {
    const repo = any.simpleObject();
    ensureAcceptability.withArgs({repo, ref}).resolves();
    acceptPR.withArgs(url, sha, number, squash).resolves();
    deleteBranch.resolves();

    return processPR(
      {payload: {number, pull_request: {url, head, repo}}},
      {github: githubCredentials, squash, deleteBranches}
    ).then(() => {
      assert.calledOnce(ensureAcceptability);
      assert.calledOnce(acceptPR);
      assert.calledWith(deleteBranch, head, deleteBranches);
    });
  });

  test('that failing status checks causes a comment to be logged against the PR and prevents PR acceptance', () => {
    const error = new Error(any.string());
    ensureAcceptability.rejects(error);

    return processPR(
      {payload: {number, pull_request: {url, head}}},
      {github: githubCredentials, squash, deleteBranches}
    ).then(() => {
      assert.notCalled(acceptPR);
      assert.notCalled(deleteBranch);
      assert.calledWith(postErrorComment, url, error);
    })
  });

  test('that failing to merge the PR causes a comment to be logged against the PR and prevents branch deletion', () => {
    const error = new Error(any.string());
    ensureAcceptability.resolves();
    acceptPR.rejects(error);

    return processPR(
      {payload: {number, pull_request: {url, head}}},
      {github: githubCredentials, squash, deleteBranches}
    ).then(() => {
      assert.notCalled(deleteBranch);
      assert.calledWith(postErrorComment, url, error);
    })
  });
});
