import { expect, test } from '@playwright/test';
import { mockBackend } from './fixtures/backend';
import { setupDefaultMocks } from './fixtures/mock-api';
import { signIn } from './fixtures/session';

test.describe('Editing (signed in)', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
		await signIn(page);
	});

	test('an edited song is shown right away, without a stale copy', async ({ page }) => {
		const backend = await mockBackend(page);
		await page.goto('/song/1');
		await page.getByRole('link', { name: 'Edit' }).click();
		await page.getByLabel('Name').fill('Song 1 (edited)');
		await page.getByRole('button', { name: 'Save' }).click();

		await expect(page.getByRole('heading', { level: 1, name: 'Song 1 (edited)' })).toBeVisible();
		expect(backend.songs[0].name).toBe('Song 1 (edited)');

		await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My songs' }).click();
		await expect(page.getByText('Song 1 (edited)')).toBeVisible();
	});

	test('editing a playlist twice applies both changes', async ({ page }) => {
		const backend = await mockBackend(page);
		await page.goto('/playlist/10');

		await page.getByRole('button', { name: 'Edit', exact: true }).click();
		await page.getByRole('button', { name: 'Remove Song 3' }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
		expect(backend.playlist.songIds).toEqual([1, 2]);

		await page.getByRole('button', { name: 'Edit', exact: true }).click();
		await page.getByRole('button', { name: 'Add songs' }).click();
		await page
			.getByRole('dialog')
			.getByRole('checkbox', { name: /Song 3/ })
			.click();
		await page.getByRole('button', { name: 'Done' }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
		expect(backend.playlist.songIds).toEqual([1, 2, 3]);
	});

	test('unsaved edits survive a reload as a draft', async ({ page }) => {
		await mockBackend(page);
		await page.goto('/song/edit/2');
		await page.getByLabel('Name').fill('Draft name');
		await page.waitForTimeout(800); // draft autosave is debounced

		page.on('dialog', (d) => d.accept());
		await page.reload();

		await expect(page.getByText('Unsaved changes restored')).toBeVisible();
		await expect(page.getByLabel('Name')).toHaveValue('Draft name');
	});
});
