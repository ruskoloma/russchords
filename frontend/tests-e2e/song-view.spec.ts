import { expect, test } from '@playwright/test';
import { mockSongApi, setupDefaultMocks } from './fixtures/mock-api';

test.describe('Song page — view & transpose', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('renders the mocked song, transposes up to C#, and transposes back to C', async ({ page }) => {
		await mockSongApi(page);

		await page.goto('/song/42');

		// Song title and artist should render in the header.
		await expect(page.getByText('Amazing Grace (Test)')).toBeVisible();
		await expect(page.getByText('Traditional')).toBeVisible();

		// The key selector is a Mantine `Select` with a placeholder of "Select key".
		// Its current value starts as the song's rootNote ('C').
		const keySelect = page.getByPlaceholder('Select key');
		await expect(keySelect).toHaveValue('C');

		// The lyric line under the first chord line must render — this is the
		// single most important regression gate for the Viewer memoization refactor.
		await expect(page.getByText('Amazing grace how sweet the sound')).toBeVisible();

		// Click "Up" to transpose a semitone. The button has an aria-label="Up".
		await page.getByRole('button', { name: 'Up', exact: true }).click();

		// C → C# or Db. The Select value should update to one of those two.
		const newValue = await keySelect.inputValue();
		expect(['C#', 'Db']).toContain(newValue);

		// Lyrics should still be present after the state change — a regression
		// that loses Viewer content on transpose would be immediately caught here.
		await expect(page.getByText('Amazing grace how sweet the sound')).toBeVisible();

		// Click "Down" to transpose back; original key should be restored.
		await page.getByRole('button', { name: 'Down', exact: true }).click();
		await expect(keySelect).toHaveValue('C');
	});

	test('increases font size when the Larger font button is clicked', async ({ page }) => {
		await mockSongApi(page);

		await page.goto('/song/42');

		// Capture a reference to the chord viewer's `<pre>` element. ViewerBase
		// renders chord content inside a Mantine `<Text component="pre">` — we
		// read its computed font-size before and after.
		const chordBlock = page.locator('pre').first();
		await expect(chordBlock).toBeVisible();

		const sizeBefore = await chordBlock.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

		await page.getByRole('button', { name: 'Larger font' }).click();

		const sizeAfter = await chordBlock.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
		expect(sizeAfter).toBeGreaterThan(sizeBefore);
	});
});
