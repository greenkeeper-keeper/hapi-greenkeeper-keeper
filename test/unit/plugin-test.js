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
    const next = () => undefined;
    const route = () => undefined;

    test('that an error is thrown if no options are provided', () => {
      assert.throws(() => register({}, undefined, next), '"value" is required');
    });

    test('that an error is thrown if the github token is not provided', () => {
      assert.throws(() => register({}, {}, next), '"github" is required');
      assert.throws(() => register({}, {github: ''}, next), '"github" must be an object');
      assert.throws(() => register({}, {github: {}}, next), '"token" is required');
      assert.throws(() => register({}, {github: {token: any.integer()}}, next), '"token" must be a string');
    });

    test('that an error is thrown if the accept-action is not provided', () => {
      assert.throws(
        () => register({}, {github: {token: any.string()}}, next),
        '"value" must contain at least one of [squash, acceptAction]'
      );
      assert.throws(
        () => register({}, {github: {token: any.string()}, squash: any.string()}, next),
        '"squash" must be a boolean'
      );
      assert.throws(
        () => register({}, {github: {token: any.string()}, acceptAction: any.integer()}, next),
        'child "acceptAction" fails because ["acceptAction" must be a string]'
      );
    });

    test('that an error is thrown if both accept-action and squash flag are provided', () => {
      assert.throws(
        () => register(
          {},
          {
            github: {token: any.string()},
            acceptAction: any.fromList(['merge', 'rebase', 'squash']),
            squash: any.boolean()
          },
          next
        ),
        '"value" contains a conflict between exclusive peers [squash, acceptAction]'
      );
    });

    test('that an error is thrown if an invalid accept-action is not provided', () => {
      assert.throws(
        () => register({}, {github: {token: any.string()}, acceptAction: any.string()}, next),
        'child "acceptAction" fails because ["acceptAction" must be one of [merge, squash, rebase]]'
      );
    });

    test('that no error is thrown if a valid accept-type is provided', () => {
      register({route}, {github: {token: any.string()}, acceptAction: 'merge'}, next);
      register({route}, {github: {token: any.string()}, acceptAction: 'squash'}, next);
      register({route}, {github: {token: any.string()}, acceptAction: 'rebase'}, next);
      register({route}, {github: {token: any.string()}, squash: true}, next);
      register({route}, {github: {token: any.string()}, squash: false}, next);
    });

    test('that an error is thrown if the flag to delete branches is not a boolean when provided', () => {
      assert.throws(
        () => register({}, {
          github: {token: any.string()},
          squash: any.boolean(),
          deleteBranches: any.string()
        }, () => undefined),
        '"deleteBranches" must be a boolean'
      );
      assert.doesNotThrow(() => register(
        {route},
        {
          github: {token: any.string()},
          squash: any.boolean(),
          deleteBranches: any.boolean()
        },
        () => undefined
      ));
    });
  });
});
