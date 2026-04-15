import type { Page } from '@playwright/test';

/**
 * Shared Playwright route mocks for the russchords safety-net suite.
 *
 * All routes should be registered BEFORE the first navigation so the app's
 * initial requests are intercepted. `setupDefaultMocks` handles the common
 * auth/OIDC endpoints; individual specs layer their own mocks on top.
 */

export const MOCK_SONG = {
	id: 42,
	name: 'Amazing Grace (Test)',
	artist: 'Traditional',
	authorId: 'test-author',
	rootNote: 'C',
	sourceUrl: undefined,
	content: [
		'Verse:',
		'C       G       Am      F',
		'Amazing grace how sweet the sound',
		'C           G     C',
		'That saved a wretch like me',
		'',
		'Chorus:',
		'F        C',
		'I once was lost',
		'G         C',
		'But now am found',
	].join('\n'),
};

/**
 * Catch-all silencer for Cognito `.well-known` and any other auth metadata
 * requests. We don't authenticate during the safety-net suite, so returning
 * 503 is fine — the app treats unauth state as the default.
 */
export async function silenceAuthMetadata(page: Page) {
	await page.route(/\/mock-cognito\/.*/, (route) => {
		return route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({ error: 'auth disabled in tests' }),
		});
	});
}

/**
 * Mock `GET {API_URL}/song/:id` to return the canned song above. Accepts a
 * `content` override so individual specs can exercise parse edge cases.
 */
export async function mockSongApi(page: Page, overrides: Partial<typeof MOCK_SONG> = {}) {
	const song = { ...MOCK_SONG, ...overrides };
	await page.route(/\/mock-api\/song\/\d+$/, (route) => {
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(song),
		});
	});
}

/**
 * Stub the Google Custom Search API used by SearchPage. The real call goes to
 * `https://www.googleapis.com/customsearch/v1?...`. We match any URL under that
 * host so we don't have to mirror the exact query-string the app builds.
 */
export async function mockGoogleSearch(page: Page, items: Array<{ title: string; link: string; snippet: string }>) {
	await page.route(/googleapis\.com\/customsearch/, (route) => {
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				items,
				searchInformation: { totalResults: String(items.length) },
			}),
		});
	});
}

/**
 * Convenience wrapper that registers all "always on" mocks for a spec.
 * Individual specs call this in a `beforeEach`.
 */
export async function setupDefaultMocks(page: Page) {
	await silenceAuthMetadata(page);
}
