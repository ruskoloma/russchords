import type { Page, Route } from '@playwright/test';

/** Values must match `.env.test`. */
export const AUTHORITY = 'http://localhost:5173/mock-cognito';
export const OIDC_USER_KEY = `oidc.user:${AUTHORITY}:mock-client-id`;

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = () => Math.floor(Date.now() / 1000);

/** Unsigned JWT — oidc-client-ts only decodes ID tokens, it doesn't verify them. */
export function idToken(claims: Record<string, unknown> = {}, expiresIn = 3600) {
	return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
		sub: 'user-1',
		iss: AUTHORITY,
		aud: 'mock-client-id',
		iat: now(),
		exp: now() + expiresIn,
		...claims,
	})}.sig`;
}

/** Seeds a stored OIDC session before the app boots (once per test). */
export async function signIn(page: Page, { expiresIn = 3600, tag = 'initial' } = {}) {
	const user = JSON.stringify({
		id_token: idToken({ tag }, expiresIn),
		access_token: 'access',
		refresh_token: 'refresh-1',
		token_type: 'Bearer',
		scope: 'openid profile email',
		profile: { sub: 'user-1', nickname: 'Tester', email: 'tester@example.com' },
		expires_at: now() + expiresIn,
	});
	await page.addInitScript(
		([key, value]) => {
			if (sessionStorage.getItem('__seeded')) return;
			localStorage.setItem(key, value);
			sessionStorage.setItem('__seeded', '1');
		},
		[OIDC_USER_KEY, user],
	);
}

/** Mocks Cognito discovery + token endpoint with the given token handler. */
export async function mockCognito(page: Page, onToken: (route: Route) => Promise<void> | void) {
	await page.route(/\/mock-cognito\//, (route) => {
		const url = route.request().url();
		if (url.includes('.well-known/openid-configuration')) {
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					issuer: AUTHORITY,
					authorization_endpoint: `${AUTHORITY}/authorize`,
					token_endpoint: `${AUTHORITY}/token`,
				}),
			});
		}
		if (url.endsWith('/token')) return onToken(route);
		return route.fulfill({ status: 404, body: '{}' });
	});
}

/** Reads the custom `tag` claim from a request's bearer token. */
export function tokenTag(authorization: string | undefined): string | null {
	const token = authorization?.replace(/^Bearer /, '');
	const payload = token?.split('.')[1];
	if (!payload) return null;
	try {
		return JSON.parse(Buffer.from(payload, 'base64url').toString()).tag ?? null;
	} catch {
		return null;
	}
}
