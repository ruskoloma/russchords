import { expect, test } from '@playwright/test';
import { setupDefaultMocks } from './fixtures/mock-api';

test.describe('Home page', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('renders the welcome headline and key features card', async ({ page }) => {
		await page.goto('/');

		// Headline — uses a 👋 emoji so we match on the leading word only.
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');

		// Key features card heading — anchors us to the static content block.
		await expect(page.getByRole('heading', { name: 'Key features' })).toBeVisible();

		// The structural example with chords is part of the home page copy.
		// If the refactor breaks the static home content we want to know immediately.
		await expect(page.getByText(/Fast song search/i)).toBeVisible();
	});
});
