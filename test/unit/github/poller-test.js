import sinon from 'sinon';
import {assert} from 'chai';
import any from '@travi/any';
import proxyquire from 'proxyquire';

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60

suite('poller', () => {
  const delay = sinon.stub();
  const poll = proxyquire('../../../src/github/poller', {delay}).default;

  test('that the poller calls the callback', () => {
    const options = any.simpleObject();
    const timeout = any.integer({max: HOUR});
    const callback = sinon.stub();
    callback.withArgs(options, timeout * 2).resolves();
    delay.withArgs(timeout).resolves();

    return assert.isFulfilled(poll(options, timeout, callback));
  });

  test('that the poller rejects if the timeout is beyond an hour', () => {
    return assert.isRejected(poll({}, HOUR + 1));
  });
});
