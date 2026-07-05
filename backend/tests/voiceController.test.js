import test from 'node:test';
import assert from 'node:assert/strict';

import { localIntentParser } from '../controllers/voiceController.js';

test('parses login navigation commands', () => {
  const result = localIntentParser('go to login page');

  assert.equal(result.action, 'navigatePage');
  assert.deepEqual(result.parameters, { page: 'login' });
  assert.match(result.response, /sign in/i);
});

test('parses Google OAuth commands', () => {
  const result = localIntentParser('continue with google');

  assert.equal(result.action, 'loginOAuth');
  assert.deepEqual(result.parameters, { provider: 'google' });
  assert.match(result.response, /Google/i);
});
