import sinon from 'sinon';
import {assert} from 'chai';
import {ACCEPTED, BAD_REQUEST} from 'http-status-codes';
import any from '@travi/any';
import {register} from '../../src/plugin';
import * as greenkeeper from '../../src/greenkeeper';

suite('plugin', () => {
  const greenkeeperSender = any.url();
  let sandbox;

  setup(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(greenkeeper, 'default')
      .returns(false)
      .withArgs(greenkeeperSender).returns(true);
  });

  teardown(() => sandbox.restore());

  test('that the plugin is defined properly', () => {
    const route = sinon.spy();
    const next = sinon.spy();

    register({route}, null, next);

    assert.calledOnce(next);
    assert.calledWith(route, sinon.match({
      method: 'POST',
      path: '/payload'
    }));
    assert.deepEqual(register.attributes.pkg, require('../../package.json'));
  });

  test('that response is accepted when pr was opened by greenkeeper', () => {
    const code = sinon.spy();
    const reply = sinon.stub();
    const route = sinon.stub().yieldsTo('handler', {
      payload: {
        action: 'opened',
        sender: {
          html_url: greenkeeperSender
        },
        pull_request: {}
      },
      log: () => undefined
    }, reply);
    reply.withArgs('ok').returns({code});

    register({route}, null, () => undefined);

    assert.calledWith(code, ACCEPTED);
  });

  test('that response is bad-request when pr not opened by greenkeeper', () => {
    const code = sinon.spy();
    const reply = sinon.stub();
    const route = sinon.stub().yieldsTo('handler', {
      payload: {
        sender: {
          html_url: any.url()
        }
      },
      log: () => undefined
    }, reply);
    reply.withArgs('skipping').returns({code});

    register({route}, null, () => undefined);

    assert.calledWith(code, BAD_REQUEST);
  });
});
