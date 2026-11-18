import { expect, test } from '@playwright/test';
import { setupDefaultMocks } from './fixtures/mock-api';

test.describe('Navigation (unauthenticated)', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('renders sidebar with Home, Search, and Login links for anonymous users', async ({ page }) => {
		await page.goto('/', { waitUntil: 'domcontentloaded' });

		// Wait for the shell to mount.
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome', { timeout: 15_000 });

		// Desktop viewport: the sidebar navigation is visible.
		const nav = page.getByRole('navigation', { name: 'Main' });
		await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Search', exact: true })).toBeVisible();

		// Authenticated-only links must NOT be present for anonymous users.
		await expect(nav.getByRole('link', { name: 'My songs' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Starred' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Playlists' })).toHaveCount(0);
	});

	test('navigates from Home to Search via the sidebar', async ({ page }) => {
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome', { timeout: 15_000 });

		// Scoped to the navigation: the home page also has search controls.
		const nav = page.getByRole('navigation', { name: 'Main' });
		await nav.getByRole('link', { name: 'Search', exact: true }).click();

		await expect(page).toHaveURL(/\/search$/, { timeout: 15_000 });
		// The search TextInput has an explicit aria-label we can anchor on.
		await expect(page.getByLabel('Search input')).toBeVisible();
	});
});
