import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import 'sinon-as-promised';

chai.use(chaiAsPromised);
sinon.assert.expose(chai.assert, {prefix: ''});
