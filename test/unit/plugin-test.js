import sinon from 'sinon';
import {assert} from 'chai';
import {register} from '../../src/plugin';

suite('plugin', () => {
  test('that the plugin is defined properly', () => {
    const route = sinon.spy();
    const next = sinon.spy();

    register({route}, null, next);

    assert.calledOnce(next);
    assert.calledWith(route, sinon.match({
      method:'POST',
      path: '/payload'
    }));
    assert.deepEqual(register.attributes.pkg, require('../../package.json'));
  });
});
