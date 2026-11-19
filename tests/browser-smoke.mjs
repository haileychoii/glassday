/** Browser verification against a disposable profile and an already running Vite.
 * Run: node tests/browser-smoke.mjs; GLASSDAY_TEST_URL / PLAYWRIGHT_MODULE are optional.
 * 한국어: 실제 사용자의 브라우저 프로필·로그인·저장 데이터에 접근하지 않는다.
 * Connections: browser-harness.tsx exercises useLocalStorage; UI checks exercise App.tsx.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && /React|render|Maximum update|hook/i.test(message.text())) errors.push(message.text());
});
try {
  await page.goto(process.env.GLASSDAY_TEST_URL || 'http://127.0.0.1:5186', { waitUntil: 'networkidle' });
  assert.ok((await page.locator('body').innerText()).includes('Settings'));
  assert.equal(await page.locator('vite-error-overlay').count(), 0);
  const hook = await page.evaluate(async () => (await import('/tests/browser-harness.tsx')).verifyStorageHook());
  console.log('Storage hook:', JSON.stringify(hook));
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/cleanup-desktop.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: app loads, no React runtime errors, storage hook regression checks');
} finally {
  await browser.close();
}
