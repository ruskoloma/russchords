import { expect, test } from '@playwright/test';
import { mockBackend } from './fixtures/backend';
import { setupDefaultMocks } from './fixtures/mock-api';
import { signIn } from './fixtures/session';

test.describe('Stage', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await setupDefaultMocks(page);
		await signIn(page);
		await mockBackend(page);
	});

	test('opens from the playlist and the old play URL redirects', async ({ page }) => {
		await page.goto('/playlist/10');
		await page.getByRole('link', { name: 'Stage' }).click();
		await expect(page).toHaveURL(/\/playlist\/10\/stage$/);
		await expect(page.getByRole('heading', { name: 'Song 1' })).toBeVisible();

		await page.goto('/playlist/10/play');
		await expect(page).toHaveURL(/\/playlist\/10\/stage$/);
		await expect(page.getByRole('heading', { name: 'Song 1' })).toBeVisible();
	});

	test('the key can only be changed from the settings panel', async ({ page }) => {
		await page.goto('/playlist/10/stage');
		await expect(page.getByRole('heading', { name: 'Song 1' })).toBeVisible();

		// One tap can only move between songs or toggle auto-scroll.
		await expect(page.getByRole('button', { name: 'Transpose up' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: /text/i })).toHaveCount(0);

		await page.getByRole('button', { name: 'Stage settings' }).click();
		const panel = page.getByRole('dialog', { name: 'Stage settings' });
		await panel.getByRole('button', { name: 'Transpose up' }).click();
		await expect(panel.getByText('original C')).toBeVisible();
		await page.keyboard.press('Escape');

		await expect(page.locator('.stage-content').getByText('from C')).toBeVisible();
		await expect(page.locator('.song-sheet').first()).toContainText('C#');
	});

	test('controls get out of the way while reading and come back on tap', async ({ page }) => {
		await page.goto('/playlist/10/stage');
		const next = page.getByRole('button', { name: 'Next song', exact: true });
		await expect(next).toBeVisible();

		await page.mouse.wheel(0, 600);
		await expect(page.locator('.stage')).toHaveAttribute('data-controls', 'hidden');
		await expect(page.locator('.stage-bar--bottom')).not.toBeInViewport();
		await expect(next).toHaveCount(0); // hidden from assistive tech and keyboard too

		await page.getByText('Lyrics line 10', { exact: true }).click();
		await expect(page.locator('.stage')).toHaveAttribute('data-controls', 'visible');
		await next.click();
		await expect(page.getByRole('heading', { name: 'Song 2' })).toBeVisible();
	});
});
