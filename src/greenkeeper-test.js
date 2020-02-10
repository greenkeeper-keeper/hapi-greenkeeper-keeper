import {assert} from 'chai';
import openedByGreenkeeperBot, {
  GREENKEEPER_INTEGRATION_GITHUB_URL,
  GREENKEEPER_BOT_GITHUB_URL
} from './greenkeeper';

suite('greenkeeper', () => {
  test('that the users are defined to match the greenkeeper bots', () => {
    assert.equal(GREENKEEPER_BOT_GITHUB_URL, 'https://github.com/marketplace/greenkeeper');
    assert.equal(GREENKEEPER_INTEGRATION_GITHUB_URL, 'https://github.com/apps/greenkeeper');
  });

  test('that true is returned for the bot used for the legacy bot', () => {
    assert.isTrue(openedByGreenkeeperBot(GREENKEEPER_BOT_GITHUB_URL));
  });

  test('that true is returned for the bot used for the github integration', () => {
    assert.isTrue(openedByGreenkeeperBot(GREENKEEPER_INTEGRATION_GITHUB_URL));
  });

  test('that false is returned if not opened by a greenkeeper bot', () => {
    assert.isFalse(openedByGreenkeeperBot());
  });
});
