import { expect, test } from '@playwright/test';
import { setupDefaultMocks } from './fixtures/mock-api';

test.describe('Home page', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('renders the welcome headline and help card for anon users', async ({ page }) => {
		await page.goto('/', { waitUntil: 'domcontentloaded' });

		// Wait for the React shell to fully mount before asserting. The auth
		// provider does some localStorage work on mount that can delay first
		// paint; without this wait the subsequent assertions sometimes race.
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome', { timeout: 15_000 });

		// Static help card at the bottom of the page — useful reference content
		// that lives on the home page for both anonymous and authenticated users.
		await expect(page.getByRole('heading', { name: /how to write a song/i })).toBeVisible();

		// Anonymous users see the sign-in CTA.
		await expect(page.getByRole('button', { name: /sign in to get started/i })).toBeVisible();
	});
});
