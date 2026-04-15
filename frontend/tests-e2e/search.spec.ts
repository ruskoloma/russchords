import { expect, test } from '@playwright/test';
import { mockGoogleSearch, setupDefaultMocks } from './fixtures/mock-api';

test.describe('Search page', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('submits a query, renders mocked results, and shows the result card', async ({ page }) => {
		await mockGoogleSearch(page, [
			{
				title: 'Amazing Grace (mocked)',
				link: 'https://holychords.pro/song/123',
				snippet: 'Classic worship song, mocked in the test suite.',
			},
			{
				title: 'How Great Thou Art (mocked)',
				link: 'https://holychords.pro/song/456',
				snippet: 'Another mocked result to prove pagination scaffolding.',
			},
		]);

		await page.goto('/search');

		// Fill the query, submit the form via the Search button.
		await page.getByLabel('Search input').fill('amazing');
		await page.getByRole('button', { name: 'Search' }).click();

		// Each result renders in its own Mantine Card with title + snippet.
		await expect(page.getByText('Amazing Grace (mocked)')).toBeVisible();
		await expect(page.getByText('How Great Thou Art (mocked)')).toBeVisible();
		await expect(page.getByText(/Found ~\d+ results/i)).toBeVisible();
	});
});
