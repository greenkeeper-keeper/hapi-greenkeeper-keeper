import highwire from 'highwire';
import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import clientFactory from '../../../src/github/request-methods';

suite('github api', () => {
  let client, sandbox;
  const githubToken = any.string();
  const url = any.url();
  const payload = any.simpleObject();
  const response = any.simpleObject();

  setup(() => {
    client = clientFactory({token: githubToken});
    sandbox = sinon.sandbox.create();

    sandbox.stub(highwire, 'post');
    sandbox.stub(highwire, 'put');
    sandbox.stub(highwire, 'del');
  });

  teardown(() => sandbox.restore());

  test('that the post method handles auth', () => {
    highwire.post.withArgs(url, payload, {headers: {Authorization: `token ${githubToken}`}}).resolves(response);

    return assert.becomes(client.post(url, payload), response);
  });

  test('that the put method handles auth', () => {
    highwire.put.withArgs(url, payload, {headers: {Authorization: `token ${githubToken}`}}).resolves(response);

    return assert.becomes(client.put(url, payload), response);
  });

  test('that the delete method handles auth', () => {
    highwire.del.withArgs(url, {headers: {Authorization: `token ${githubToken}`}}).resolves(response);

    return assert.becomes(client.del(url), response);
  });
});
