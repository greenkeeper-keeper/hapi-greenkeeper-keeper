import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import processPR from '../../src/process';
import * as actionsFactory from '../../src/github/actions';

suite('process', () => {
  let sandbox, acceptPR, postErrorComment, ensureAcceptability;
  const githubCredentials = any.simpleObject();
  const url = any.url();
  const sha = any.string();
  const ref = any.string();
  const repo = any.simpleObject();
  const head = {sha, ref, repo};
  const number = any.integer();

  setup(() => {
    sandbox = sinon.sandbox.create();

    ensureAcceptability = sinon.stub();
    acceptPR = sinon.stub();
    postErrorComment = sinon.stub();

    sandbox.stub(actionsFactory, 'default').withArgs(githubCredentials).returns({
      ensureAcceptability,
      acceptPR,
      postErrorComment
    });
  });

  teardown(() => sandbox.restore());

  test('that processing a greenkeeper PR confirms that it can be merged, merges', () => {
    const log = sinon.stub();
    const acceptAction = any.string();
    ensureAcceptability.resolves();
    acceptPR.resolves();

    return processPR({log}, {url, head, number}, {github: githubCredentials, acceptAction}).then(() => {
      const message = any.string();
      const message2 = any.string();
      const tags = any.listOf(any.string);
      assert.calledWith(ensureAcceptability, {repo, sha, url});
      assert.calledWith(acceptPR, repo, sha, number, acceptAction);

      ensureAcceptability.getCall(0).args[1](tags, message2);
      assert.calledWith(log, tags, message2);

      acceptPR.getCall(0).args[4](tags, message);
      assert.calledWith(log, tags, message);
    });
  });

  test('that failing status checks causes a comment to be logged against the PR and prevents PR acceptance', () => {
    const error = new Error(any.string());
    ensureAcceptability.rejects(error);
    postErrorComment.resolves(error);

    return processPR({log: () => undefined}, {head, number}, {github: githubCredentials}).then(() => {
      assert.notCalled(acceptPR);
      assert.calledWith(postErrorComment, repo, number, error);
    });
  });

  test('that pending statuses when polling is disabled does not result in a comment', () => {
    ensureAcceptability.rejects(new Error('pending'));

    return processPR(
      {log: () => undefined},
      {comments_url: url, head},
      {github: githubCredentials}
    ).then(() => {
      assert.notCalled(acceptPR);
      assert.notCalled(postErrorComment);
    });
  });

  test('that failing to merge the PR causes a comment to be logged against the PR', () => {
    const error = new Error(any.string());
    ensureAcceptability.resolves();
    acceptPR.rejects(error);
    postErrorComment.resolves(error);

    return processPR({log: () => undefined}, {head, number}, {github: githubCredentials}).then(() => {
      assert.calledWith(postErrorComment, repo, number, error);
    });
  });

  test('that a rejection from the comment call is caught', () => {
    const error = new Error(any.string());
    ensureAcceptability.rejects(error);
    postErrorComment.rejects(error);

    return processPR({log: () => undefined}, {url, head}, {github: githubCredentials}).then(() => {
      assert.calledOnce(postErrorComment);
    });
  });
});
