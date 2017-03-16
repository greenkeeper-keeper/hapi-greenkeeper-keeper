/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

sinon.behavior = require('sinon/lib/sinon/behavior');

sinon.defaultConfig = {
  injectInto: null,
  properties: ['spy', 'stub', 'mock', 'clock', 'server', 'requests'],
  useFakeTimers: true,
  useFakeServer: true
};
require('sinon-as-promised');

chai.use(chaiAsPromised);
sinon.assert.expose(chai.assert, {prefix: ''});
