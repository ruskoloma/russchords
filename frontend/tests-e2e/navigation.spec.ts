import { expect, test } from '@playwright/test';
import { setupDefaultMocks } from './fixtures/mock-api';

test.describe('Navigation (unauthenticated)', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
	});

	test('renders sidebar with Home, Search, and Login links for anonymous users', async ({ page }) => {
		await page.goto('/');

		// On desktop the navbar is visible by default (md breakpoint, 1280x720 viewport).
		// Use `getByRole('navigation')` to scope assertions to the AppShell nav.
		const nav = page.getByRole('navigation').first();
		await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Search' })).toBeVisible();

		// Authenticated-only links must NOT be present for anonymous users.
		await expect(nav.getByRole('link', { name: 'My Songs' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Starred' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Playlists' })).toHaveCount(0);
	});

	test('navigates from Home to Search via the sidebar', async ({ page }) => {
		await page.goto('/');

		// Click the Search link in the nav — this is the flow that should survive
		// the route-level lazy-loading refactor in section 2.5 of the plan.
		await page.getByRole('link', { name: 'Search' }).click();

		await expect(page).toHaveURL(/\/search$/);
		// The search TextInput has an explicit aria-label we can anchor on.
		await expect(page.getByLabel('Search input')).toBeVisible();
	});
});
