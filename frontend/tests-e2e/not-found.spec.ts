import { expect, test } from '@playwright/test';
import { setupDefaultMocks } from './fixtures/mock-api';

test.describe('Not found + error page', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('renders the NotFound page for an unknown route', async ({ page }) => {
		// `/this-route-does-not-exist` resolves to the `path: '*'` route in main.tsx,
		// which renders the <NotFound /> component. This spec exists to pin the
		// behavior so the upcoming router refactor doesn't silently drop the 404.
		await page.goto('/this-route-does-not-exist', { waitUntil: 'domcontentloaded' });

		// Wait for the NotFound "404" heading to mount before checking body text.
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

		// The funny crash-page GIF lives in the ErrorPage component; NotFound is
		// different but equally expected to render *some* recognizable message.
		const pageText = await page.textContent('body');
		expect(pageText ?? '').toMatch(/not found|404|missing|doesn't exist/i);
	});
});
