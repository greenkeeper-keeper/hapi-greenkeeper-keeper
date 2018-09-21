import sinon from 'sinon';
import {assert} from 'chai';
import any from '@travi/any';
import {plugin} from '../../src/plugin';
import * as validatePayloadAndProcess from '../../src/handler';

suite('plugin', () => {
  const possibleAcceptActions = ['merge', 'squash', 'rebase'];
  const options = {
    github: {token: any.string()},
    acceptAction: any.fromList(possibleAcceptActions)
  };
  let sandbox;

  setup(() => {
    sandbox = sinon.createSandbox();

    sandbox.stub(validatePayloadAndProcess, 'default');
  });

  teardown(() => sandbox.restore());

  test('that the plugin is defined properly', () => {
    const route = sinon.spy();

    return plugin.register({route}, options).then(() => {
      assert.calledWith(route, sinon.match({
        method: 'POST',
        path: '/payload'
      }));
      assert.deepEqual(plugin.pkg, require('../../package.json'));
    });
  });

  suite('responses', () => {
    test('that the payload gets validated and processed', () => {
      const request = {};
      const reply = sinon.stub();
      const route = sinon.stub().yieldsTo('handler', request, reply);

      plugin.register({route}, options, () => undefined);

      assert.calledWith(validatePayloadAndProcess.default, request, reply, sinon.match(options));
    });
  });

  suite('options validation', () => {
    const next = () => undefined;
    const route = () => undefined;

    test('that an error is thrown if no options are provided', () => assert.isRejected(
      plugin.register({}, undefined, next),
      '"value" is required'
    ));

    test('that an error is thrown if the github config is not provided', () => assert.isRejected(
      plugin.register({}, {}, next),
      '"github" is required'
    ));

    test('that an error is thrown if the github config is not an object', () => assert.isRejected(
      plugin.register({}, {github: ''}, next),
      '"github" must be an object'
    ));

    test('that an error is thrown if the github token is not provided', () => assert.isRejected(
      plugin.register({}, {github: {}}, next),
      '"token" is required'
    ));

    test('that an error is thrown if the github token is an inappropriate type', () => assert.isRejected(
      plugin.register({}, {github: {token: any.integer()}}, next),
      '"token" must be a string'
    ));

    test(
      'that an error is thrown if the `acceptAction` setting is not provided',
      () => assert.isRejected(
        plugin.register({}, {github: {token: any.string()}}, next),
        'child "acceptAction" fails because ["acceptAction" is required]'
      )
    );

    test('that an error is thrown if the accept-action is not provided as an appropriate type', () => assert.isRejected(
      plugin.register({}, {github: {token: any.string()}, acceptAction: any.integer()}, next),
      'child "acceptAction" fails because ["acceptAction" must be a string]'
    ));

    test('that an error is thrown if an invalid accept-action is not provided', () => assert.isRejected(
      plugin.register({}, {github: {token: any.string()}, acceptAction: any.string()}, next),
      'child "acceptAction" fails because ["acceptAction" must be one of [merge, squash, rebase]]'
    ));

    test('that no error is thrown if a valid accept-type is provided', () => Promise.all([
      plugin.register({route}, {github: {token: any.string()}, acceptAction: 'merge'}, next),
      plugin.register({route}, {github: {token: any.string()}, acceptAction: 'squash'}, next),
      plugin.register({route}, {github: {token: any.string()}, acceptAction: 'rebase'}, next)
    ]));

    test('that no error occurs for valid config', () => assert.isFulfilled(plugin.register(
      {route},
      {github: {token: any.string()}, acceptAction: any.fromList(possibleAcceptActions)},
      () => undefined
    )));
  });
});
