/** Desktop OAuth callback checks, without contacting Supabase or changing the
 * user's session. / 실제 로그인 없이 앱 복귀 주소와 오류 처리를 검사한다. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DESKTOP_AUTH_CALLBACK_URL,
  readDesktopAuthCallback,
} from '../src/lib/desktopAuth.ts';

test('accepts the exact desktop callback and one-time PKCE code', () => {
  assert.deepEqual(
    readDesktopAuthCallback(`${DESKTOP_AUTH_CALLBACK_URL}?code=one-time-code`),
    { code: 'one-time-code' }
  );
});

test('reports OAuth errors without treating them as a code', () => {
  assert.deepEqual(
    readDesktopAuthCallback(`${DESKTOP_AUTH_CALLBACK_URL}#error_description=Access+denied`),
    { error: 'Access denied' }
  );
  assert.deepEqual(readDesktopAuthCallback(DESKTOP_AUTH_CALLBACK_URL), {
    error: 'No sign-in code was returned.',
  });
});

test('ignores other schemes, paths and malformed links', () => {
  for (const url of [
    'https://glassday.vercel.app/?code=wrong-origin',
    'glassday-desktop://other/callback?code=wrong-host',
    'glassday-desktop://auth/other?code=wrong-path',
    'not a URL',
  ]) {
    assert.equal(readDesktopAuthCallback(url), null);
  }
});
