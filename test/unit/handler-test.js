import {assert} from 'chai';
import sinon from 'sinon';
import {ACCEPTED, NO_CONTENT, BAD_REQUEST, UNSUPPORTED_MEDIA_TYPE} from 'http-status-codes';
import any from '@travi/any';
import boom from 'boom';
import * as actionsFactory from '../../src/github/actions';
import * as greenkeeper from '../../src/greenkeeper';
import * as process from '../../src/process';
import handler from '../../src/handler';

suite('handler', () => {
  let sandbox, response, code;
  const greenkeeperSender = any.url();
  const githubCredentials = {token: any.string()};
  const settings = {...any.simpleObject(), github: githubCredentials};
  const log = sinon.spy();

  setup(() => {
    response = sinon.stub();
    code = sinon.spy();

    sandbox = sinon.createSandbox();

    response.withArgs('skipping').returns({code});

    sandbox.stub(boom, 'internal');
    sandbox.stub(greenkeeper, 'default')
      .returns(false)
      .withArgs(greenkeeperSender).returns(true);
    sandbox.stub(process, 'default').resolves();
  });

  teardown(() => {
    sandbox.restore();
    log.resetHistory();
  });

  suite('`status` event', () => {
    let getPullRequestsForCommit, getPullRequest;
    const error = new Error(any.sentence());
    const wrappedError = any.simpleObject();

    setup(() => {
      getPullRequestsForCommit = sinon.stub();
      getPullRequest = sinon.stub();

      sandbox.stub(actionsFactory, 'default')
        .withArgs(githubCredentials)
        .returns({getPullRequestsForCommit, getPullRequest});
    });

    test('that the webhook is accepted and processed for a successful status and a matching greenkeeper PR', () => {
      const repository = any.simpleObject();
      const branch = any.string();
      const prNumber = any.integer();
      const sha = any.string();
      const partialPullRequest = {user: {html_url: greenkeeperSender}, number: prNumber};
      const fullPullRequest = any.simpleObject();
      const request = {
        payload: {
          state: 'success',
          sha,
          repository,
          branches: [{name: branch}]
        },
        headers: {'x-github-event': 'status'},
        log: () => undefined
      };
      response.withArgs('status event will be processed').returns({code});
      getPullRequestsForCommit.withArgs({ref: sha}).resolves([partialPullRequest]);
      getPullRequest.withArgs(repository, prNumber).resolves(fullPullRequest);

      return handler(request, {response}, settings).then(() => {
        assert.calledWith(code, ACCEPTED);
        assert.calledWith(process.default, fullPullRequest, settings);
      });
    });

    test('that the response is bad-request when the state is not `success`', () => {
      const request = {
        payload: {state: any.string()},
        headers: {'x-github-event': 'status'},
        log
      };

      return handler(request, {response}, settings).then(() => {
        assert.calledWith(code, BAD_REQUEST);
        assert.calledWith(log, ['PR'], 'skipping');
      });
    });

    test('that the response is bad-request when commit is on multiple branches', () => {
      const request = {
        payload: {state: 'success', branches: [{}, {}]},
        headers: {'x-github-event': 'status'},
        log
      };

      return handler(request, {response}, settings).then(() => {
        assert.calledWith(code, BAD_REQUEST);
        assert.calledWith(log, ['PR'], 'skipping');
      });
    });

    test('that the response is bad-request when commit is on master', () => {
      const request = {
        payload: {state: 'success', branches: [{name: 'master'}]},
        headers: {'x-github-event': 'status'},
        log
      };

      return handler(request, {response}, settings).then(() => {
        assert.calledWith(code, BAD_REQUEST);
        assert.calledWith(log, ['PR'], 'skipping');
      });
    });

    test('that the response is bad-request if there are no PRs for the commit', () => {
      const request = {
        payload: {state: 'success', branches: [{name: any.string()}]},
        headers: {'x-github-event': 'status'},
        log: () => undefined
      };
      getPullRequestsForCommit.resolves([]);
      response.withArgs('no PRs for this commit').returns({code});

      return handler(request, {response}, settings).then(() => assert.calledWith(code, BAD_REQUEST));
    });

    test('that a server-error is returned if the list of PRs for the commit is greater than one', () => {
      const request = {
        payload: {state: 'success', branches: [{name: any.string()}]},
        headers: {'x-github-event': 'status'},
        log: () => undefined
      };
      getPullRequestsForCommit.resolves([{}, {}]);
      boom.internal.withArgs('too many PRs exist for this commit').returns(error);

      return handler(request, {response}, settings).catch(err => assert.equal(err, wrappedError));
    });

    test('that the response is bad-request if the PR is not from greenkeeper', () => {
      const senderUrl = any.url();
      const request = {
        payload: {state: 'success', branches: [{name: any.string()}]},
        headers: {'x-github-event': 'status'},
        log: () => undefined
      };
      getPullRequestsForCommit.resolves([{user: {html_url: senderUrl}}]);
      response.withArgs(`PR is not from greenkeeper, but from ${senderUrl}`).returns({code});

      return handler(request, {response}, settings).then(() => assert.calledWith(code, BAD_REQUEST));
    });

    test('that a server-error is reported if the fetching of related PRs fails', () => {
      const request = {
        payload: {
          state: 'success',
          repository: any.string(),
          branches: [{name: any.string()}]
        },
        headers: {'x-github-event': 'status'},
        log: () => undefined
      };
      getPullRequestsForCommit.rejects(error);
      boom.internal.withArgs('failed to fetch PRs', error).returns(wrappedError);

      return handler(request, {response}, settings).then(err => assert.equal(err, wrappedError));
    });
  });

  suite('`check_run` event', () => {
    let getPullRequest;
    const error = new Error(any.sentence());
    const wrappedError = new Error(any.sentence());

    setup(() => {
      getPullRequest = sinon.stub();

      sandbox.stub(actionsFactory, 'default')
        .withArgs(githubCredentials)
        .returns({getPullRequest});
    });

    test('that the webhook is accepted and processed for a successful check_run and a matching greenkeeper PR', () => {
      const repository = any.simpleObject();
      const branch = any.string();
      const prNumber = any.integer();
      const sha = any.string();
      const partialPullRequest = {user: {html_url: greenkeeperSender}, number: prNumber};
      const fullPullRequest = {...any.simpleObject(), user: {html_url: greenkeeperSender}};
      const request = {
        payload: {
          action: 'completed',
          check_run: {
            status: 'completed',
            conclusion: 'success',
            head_sha: sha,
            check_suite: {
              head_branch: branch,
              pull_requests: [partialPullRequest]
            }
          },
          repository
        },
        headers: {'x-github-event': 'check_run'},
        log: () => undefined
      };
      response.withArgs('check_run event will be processed').returns({code});
      getPullRequest.withArgs(repository, prNumber).resolves(fullPullRequest);

      return handler(request, {response}, settings).then(() => {
        assert.calledWith(code, ACCEPTED);
        assert.calledWith(process.default, fullPullRequest, settings);
      });
    });

    test('that the response is bad-request when the status is not `completed`', () => {
      const status = any.string();
      const request = {
        payload: {
          action: status,
          check_run: {
            status,
            check_suite: {}
          }
        },
        headers: {'x-github-event': 'check_run'},
        log
      };

      return handler(request, {response}, settings).then(() => {
        assert.calledWith(code, BAD_REQUEST);
        assert.calledWith(log, ['PR'], 'skipping');
      });
    });

    test('that the response is bad-request when the conclusion is not `success`', () => {
      const request = {
        payload: {
          action: 'completed',
          check_run: {
            status: 'completed',
            conclusion: any.word(),
            check_suite: {}
          }
        },
        headers: {'x-github-event': 'check_run'},
        log
      };

      return handler(request, {response}, settings).then(() => {
        assert.calledWith(code, BAD_REQUEST);
        assert.calledWith(log, ['PR'], 'skipping');
      });
    });

    test('that the response is bad-request when commit is on master', () => {
      const request = {
        payload: {
          action: 'completed',
          check_run: {
            status: 'completed',
            conclusion: 'success',
            check_suite: {head_branch: 'master'}
          }
        },
        headers: {'x-github-event': 'check_run'},
        log
      };

      return handler(request, {response}, settings).then(() => {
        assert.calledWith(code, BAD_REQUEST);
        assert.calledWith(log, ['PR'], 'skipping');
      });
    });

    test('that the response is bad-request if there are no PRs for the commit', () => {
      const request = {
        payload: {
          action: 'completed',
          check_run: {
            status: 'completed',
            conclusion: 'success',
            check_suite: {
              head_branch: any.word(),
              pull_requests: []
            }
          }
        },
        headers: {'x-github-event': 'check_run'},
        log: () => undefined
      };
      response.withArgs('no PRs for this commit').returns({code});

      return handler(request, {response}, settings).then(() => assert.calledWith(code, BAD_REQUEST));
    });

    test('that a server-error is returned if the list of PRs for the commit is greater than one', () => {
      const request = {
        payload: {
          action: 'completed',
          check_run: {
            status: 'completed',
            conclusion: 'success',
            check_suite: {
              head_branch: any.word(),
              pull_requests: [
                any.simpleObject(),
                any.simpleObject()
              ]
            }
          }
        },
        headers: {'x-github-event': 'check_run'},
        log: () => undefined
      };
      boom.internal.withArgs('too many PRs exist for this commit').returns(error);

      return handler(request, {response}, settings).then(() => assert.calledWith(response, error));
    });

    test('that the response is bad-request if the PR is not from greenkeeper', () => {
      const senderUrl = any.url();
      const prNumber = any.integer();
      const repository = any.simpleObject();
      const partialPullRequest = {user: {html_url: greenkeeperSender}, number: prNumber};
      const fullPullRequest = {...any.simpleObject(), user: {html_url: senderUrl}};
      const request = {
        payload: {
          action: 'completed',
          check_run: {
            status: 'completed',
            conclusion: 'success',
            check_suite: {
              head_branch: any.word(),
              pull_requests: [partialPullRequest]
            }
          },
          repository
        },
        headers: {'x-github-event': 'check_run'},
        log: () => undefined
      };
      response.withArgs(`PR is not from greenkeeper, but from ${senderUrl}`).returns({code});
      getPullRequest.withArgs(repository, prNumber).resolves(fullPullRequest);

      return handler(request, {response}, settings).then(() => assert.calledWith(code, BAD_REQUEST));
    });

    test('that a server-error is reported if the fetching of related PR fails', () => {
      const request = {
        payload: {
          action: 'completed',
          check_run: {
            status: 'completed',
            conclusion: 'success',
            check_suite: {
              head_branch: any.word(),
              pull_requests: [any.simpleObject()]
            }
          },
          sender: {html_url: greenkeeperSender}
        },
        headers: {'x-github-event': 'check_run'},
        log: () => undefined
      };
      getPullRequest.rejects(error);
      boom.internal.withArgs('failed to fetch PRs', error).returns(wrappedError);

      return handler(request, {response}, settings).catch(err => assert.equal(err, wrappedError));
    });
  });

  suite('`ping` event', () => {
    test('that a 204 response is provided for a ping request', () => {
      const request = {
        payload: {
          hook: {
            config: {
              content_type: 'json'
            }
          }
        },
        headers: {'x-github-event': 'ping'},
        log: () => undefined
      };
      response.withArgs('successfully configured the webhook for greenkeeper-keeper').returns({code});

      return handler(request, {response}, settings).then(() => assert.calledWith(code, NO_CONTENT));
    });

    test('that a 415 response is sent when the ping shows that the hook is not configured to send json', () => {
      const request = {
        payload: {
          hook: {
            config: {
              content_type: 'form'
            }
          }
        },
        headers: {'x-github-event': 'ping'},
        log: () => undefined
      };
      response.withArgs('please update your webhook configuration to send application/json').returns({code});

      return handler(request, {response}, settings).then(() => assert.calledWith(code, UNSUPPORTED_MEDIA_TYPE));
    });
  });

  suite('other statuses', () => {
    test('that response is bad-request when the webhook event is not `pull_request` or `status', async () => {
      const event = any.word();
      const request = {
        payload: {},
        headers: {'x-github-event': event},
        log
      };
      response.withArgs(`event was \`${event}\` instead of \`status\` or \`check_run\``).returns({code});

      await handler(request, {response}, settings);

      assert.calledWith(code, BAD_REQUEST);
    });
  });
});
