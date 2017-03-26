import sinon from 'sinon';
import {assert} from 'chai';
import any from '@travi/any';
import {register} from '../../src/plugin';
import * as validatePayloadAndProcess from '../../src/handler';

suite('plugin', () => {
  const options = {
    github: {token: any.string()},
    squash: any.boolean()
  };
  let sandbox;

  setup(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(validatePayloadAndProcess, 'default');
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
    test('that the payload gets validated and processed', () => {
      const request = {};
      const reply = sinon.stub();
      const route = sinon.stub().yieldsTo('handler', request, reply);

      register({route}, options, () => undefined);

      assert.calledWith(validatePayloadAndProcess.default, request, reply, sinon.match(options));
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
