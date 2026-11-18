import { expect, test } from '@playwright/test';
import { MOCK_SONG } from './fixtures/mock-api';
import { idToken, mockCognito, OIDC_USER_KEY, signIn, tokenTag } from './fixtures/session';

test.describe('Session', () => {
	test('renews an expired token with the refresh token and keeps the user signed in', async ({ page }) => {
		let tokenCalls = 0;
		await mockCognito(page, (route) => {
			tokenCalls++;
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id_token: idToken({ tag: 'renewed' }),
					access_token: 'a2',
					expires_in: 3600,
					token_type: 'Bearer',
				}),
			});
		});
		const tags: Array<string | null> = [];
		await page.route(/\/mock-api\/song\/my\/light$/, (route) => {
			tags.push(tokenTag(route.request().headers()['authorization']));
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([{ id: 1, name: 'Renewed Song', tags: [] }]),
			});
		});
		await signIn(page, { expiresIn: -60 });

		await page.goto('/my-songs');

		await expect(page.getByText('Renewed Song')).toBeVisible();
		expect(tokenCalls).toBe(1);
		expect(tags.at(-1)).toBe('renewed');
		const refreshToken = await page.evaluate(
			(k) => JSON.parse(localStorage.getItem(k) ?? '{}').refresh_token,
			OIDC_USER_KEY,
		);
		expect(refreshToken).toBe('refresh-1');
	});

	test('a rejected refresh token signs out locally without leaving the page', async ({ page }) => {
		await mockCognito(page, (route) =>
			route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant' }) }),
		);
		await page.route(/\/mock-api\/song\/\d+$/, (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SONG) }),
		);
		await signIn(page, { expiresIn: -60 });

		await page.goto('/song/42');

		await expect(page.getByText('Session expired')).toBeVisible();
		await expect(page).toHaveURL(/\/song\/42$/);
		await expect(page.getByRole('heading', { level: 1, name: MOCK_SONG.name })).toBeVisible();
		expect(await page.evaluate((k) => localStorage.getItem(k), OIDC_USER_KEY)).toBeNull();
	});

	test('a Cognito outage does not end the session', async ({ page }) => {
		await mockCognito(page, (route) => route.fulfill({ status: 503, body: 'unavailable' }));
		await page.route(/\/mock-api\/song\/\d+$/, (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SONG) }),
		);
		await signIn(page, { expiresIn: -60 });

		await page.goto('/song/42');

		await expect(page.getByRole('heading', { level: 1, name: MOCK_SONG.name })).toBeVisible();
		await expect(page.getByText('Session expired')).toHaveCount(0);
		expect(await page.evaluate((k) => localStorage.getItem(k), OIDC_USER_KEY)).not.toBeNull();
	});
});
