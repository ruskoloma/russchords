import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the russchords frontend smoke suite.
 *
 * Goals:
 *   - Run `npm run dev -- --mode test` so Vite picks up `.env.test` and boots
 *     with mock Cognito/API values — no AWS credentials required.
 *   - Intercept all backend calls at the Playwright level via `page.route()`.
 *     No MSW, no real backend, no flaky network.
 *   - Run on Chromium only for the safety-net minimum; Firefox/WebKit can be
 *     added later if cross-browser coverage becomes a concern.
 */
export default defineConfig({
	testDir: './tests-e2e',
	timeout: 30_000,
	expect: { timeout: 5_000 },
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],

	webServer: {
		command: 'npm run dev -- --mode test --port 5173 --strictPort',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		stdout: 'ignore',
		stderr: 'pipe',
	},
});
