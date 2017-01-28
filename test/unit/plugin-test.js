import sinon from 'sinon';
import {assert} from 'chai';
import {ACCEPTED, NO_CONTENT, BAD_REQUEST} from 'http-status-codes';
import any from '@travi/any';
import {register} from '../../src/plugin';
import * as greenkeeper from '../../src/greenkeeper';
import * as process from '../../src/process';

suite('plugin', () => {
  const greenkeeperSender = any.url();
  const options = {
    github: {token: any.string()},
    squash: any.boolean()
  };
  let sandbox;

  setup(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(greenkeeper, 'default')
      .returns(false)
      .withArgs(greenkeeperSender).returns(true);
    sandbox.stub(process, 'default');
  });

  teardown(() => sandbox.restore());

  test('that the plugin is defined properly', () => {
    const route = sinon.spy();
    const next = sinon.spy();

    register({route}, options, next);

    assert.calledOnce(next);
    assert.calledWith(route, sinon.match({
      method: 'POST',
      path: '/payload'
    }));
    assert.deepEqual(register.attributes.pkg, require('../../package.json'));
  });

  suite('responses', () => {
    test('that response is accepted when pr was opened by greenkeeper and is then processed', () => {
      const code = sinon.spy();
      const reply = sinon.stub();
      const request = {
        payload: {
          action: 'opened',
          sender: {
            html_url: greenkeeperSender
          },
          pull_request: {}
        },
        headers: {'x-github-event': 'pull_request'},
        log: () => undefined
      };
      const route = sinon.stub().yieldsTo('handler', request, reply);
      reply.withArgs('ok').returns({code});

      register({route}, options, () => undefined);

      assert.calledWith(code, ACCEPTED);
      assert.calledWith(process.default, request, options);
    });

    test('that response is bad-request when the webhook event is not `pull_request`', () => {
      const code = sinon.spy();
      const reply = sinon.stub();
      const route = sinon.stub().yieldsTo('handler', {
        payload: {
          action: 'opened',
          sender: {
            html_url: greenkeeperSender
          }
        },
        headers: {'x-github-event': any.word()},
        log: () => undefined
      }, reply);
      reply.withArgs('skipping').returns({code});

      register({route}, options, () => undefined);

      assert.calledWith(code, BAD_REQUEST);
    });

    test('that response is bad-request when the webhook action is not `opened`', () => {
      const code = sinon.spy();
      const reply = sinon.stub();
      const route = sinon.stub().yieldsTo('handler', {
        payload: {
          action: any.word(),
          sender: {
            html_url: greenkeeperSender
          }
        },
        headers: {'x-github-event': 'pull_request'},
        log: () => undefined
      }, reply);
      reply.withArgs('skipping').returns({code});

      register({route}, options, () => undefined);

      assert.calledWith(code, BAD_REQUEST);
    });

    test('that response is bad-request when pr not opened by greenkeeper', () => {
      const code = sinon.spy();
      const reply = sinon.stub();
      const route = sinon.stub().yieldsTo('handler', {
        payload: {
          action: 'opened',
          sender: {
            html_url: any.url()
          }
        },
        headers: {'x-github-event': 'pull_request'},
        log: () => undefined
      }, reply);
      reply.withArgs('skipping').returns({code});

      register({route}, options, () => undefined);

      assert.calledWith(code, BAD_REQUEST);
    });

    test('that a 204 response is provided for a ping request', () => {
      const code = sinon.spy();
      const reply = sinon.stub();
      const route = sinon.stub().yieldsTo('handler', {
        payload: {
          hook: {
            config: {
              content_type: 'json'
            }
          }
        },
        headers: {'x-github-event': 'ping'},
        log: () => undefined
      }, reply);
      reply.withArgs('successfully configured the webhook for greenkeeper-keeper').returns({code});

      register({route}, options, () => undefined);

      assert.calledWith(code, NO_CONTENT);
    });

    test('that a 400 response is sent when the ping shows that the hook is not configured to send json', () => {
      const code = sinon.spy();
      const reply = sinon.stub();
      const route = sinon.stub().yieldsTo('handler', {
        payload: {
          hook: {
            config: {
              content_type: 'form'
            }
          }
        },
        headers: {'x-github-event': 'ping'},
        log: () => undefined
      }, reply);
      reply.withArgs('please update your webhook configuration to send application/json').returns({code});

      register({route}, options, () => undefined);

      assert.calledWith(code, BAD_REQUEST);
    });
  });

  suite('options validation', () => {
    test('that an error is thrown if no options are provided', () => {
      assert.throws(() => register({}, undefined, () => undefined), '"value" is required');
    });

    test('that an error is thrown if the github token is not provided', () => {
      assert.throws(() => register({}, {}, () => undefined), '"github" is required');
      assert.throws(() => register({}, {github: ''}, () => undefined), '"github" must be an object');
      assert.throws(() => register({}, {github: {}}, () => undefined), '"token" is required');
      assert.throws(() => register({}, {github: {token: any.integer()}}, () => undefined), '"token" must be a string');
    });

    test('that an error is thrown if the flag to squash before merging is not provided', () => {
      assert.throws(() => register({}, {github: {token: any.string()}}, () => undefined), '"squash" is required');
      assert.throws(
        () => register({}, {github: {token: any.string()}, squash: any.string()}, () => undefined),
        '"squash" must be a boolean'
      );
    });

    test('that an error is thrown if the flag to delete branches is not a boolean when provided', () => {
      const route = sinon.stub();

      assert.throws(
        () => register({}, {
          github: {token: any.string()},
          squash: any.boolean(),
          deleteBranches: any.string()
        }, () => undefined),
        '"deleteBranches" must be a boolean'
      );
      assert.doesNotThrow(
        () => register({route}, {
          github: {token: any.string()},
          squash: any.boolean(),
          deleteBranches: any.boolean()
        }, () => undefined)
      );
    });
  });
});
