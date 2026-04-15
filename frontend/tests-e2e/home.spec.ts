import { expect, test } from '@playwright/test';
import { setupDefaultMocks } from './fixtures/mock-api';

test.describe('Home page', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('renders the welcome headline and key features card', async ({ page }) => {
		await page.goto('/', { waitUntil: 'domcontentloaded' });

		// Headline is the first thing that should render — give it a generous
		// timeout so the auth provider has time to initialize on slow machines.
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome', { timeout: 15_000 });

		// Both the Key features card and the How to write... card are static
		// content the home page is expected to render for everyone.
		await expect(page.getByRole('heading', { name: 'Key features' })).toBeVisible();
		await expect(page.getByRole('heading', { name: /how to write a song/i })).toBeVisible();
	});
});
