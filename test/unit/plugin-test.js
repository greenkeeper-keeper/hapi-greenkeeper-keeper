import sinon from 'sinon';
import {assert} from 'chai';
import {ACCEPTED, BAD_REQUEST} from 'http-status-codes';
import any from '@travi/any';
import {register, processPR} from '../../src/plugin';
import * as greenkeeper from '../../src/greenkeeper';
import * as process from '../../src/process';

suite('plugin', () => {
  const greenkeeperSender = any.url();
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

    register({route}, {}, next);

    assert.calledOnce(next);
    assert.calledWith(route, sinon.match({
      method: 'POST',
      path: '/payload'
    }));
    assert.deepEqual(register.attributes.pkg, require('../../package.json'));
  });

  test('that response is accepted when pr was opened by greenkeeper and is then processed', () => {
    const code = sinon.spy();
    const reply = sinon.stub();
    const options = any.simpleObject();
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

    register({route}, {}, () => undefined);

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

    register({route}, {}, () => undefined);

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

    register({route}, {}, () => undefined);

    assert.calledWith(code, BAD_REQUEST);
  });
});
