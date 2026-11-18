import { expect, test } from '@playwright/test';
import { mockSongApi, setupDefaultMocks } from './fixtures/mock-api';

test.describe('Song page — view & transpose', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('renders the mocked song, transposes up to C#, and transposes back to C', async ({ page }) => {
		await mockSongApi(page);

		await page.goto('/song/42');

		await expect(page.getByRole('heading', { level: 1, name: 'Amazing Grace (Test)' })).toBeVisible();
		await expect(page.getByText('Traditional')).toBeVisible();

		// The key picker starts at the song's root note.
		const keySelect = page.getByRole('textbox', { name: 'Key' });
		await expect(keySelect).toHaveValue('C');
		await expect(page.getByText('Amazing grace how sweet the sound')).toBeVisible();

		await page.getByRole('button', { name: 'Transpose up' }).click();
		expect(['C#', 'Db']).toContain(await keySelect.inputValue());
		await expect(page.getByText('Amazing grace how sweet the sound')).toBeVisible();

		await page.getByRole('button', { name: 'Transpose down' }).click();
		await expect(keySelect).toHaveValue('C');
	});

	test('increases font size when the Larger text button is clicked', async ({ page }) => {
		await mockSongApi(page);

		await page.goto('/song/42');

		const sheet = page.locator('pre.song-sheet').first();
		await expect(sheet).toBeVisible();
		const sizeBefore = await sheet.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

		await page.getByRole('button', { name: 'Larger text' }).click();

		await expect
			.poll(() => sheet.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))
			.toBeGreaterThan(sizeBefore);
	});

	test('shows a not-found message for a missing song', async ({ page }) => {
		await page.route(/\/mock-api\/song\/\d+$/, (route) => route.fulfill({ status: 404, body: '{}' }));
		await page.goto('/song/999');
		await expect(page.getByRole('heading', { level: 1, name: 'Song not found' })).toBeVisible();
	});
});
