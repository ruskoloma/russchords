import { getIdToken, refreshSession } from '../auth/session';

/** Normalized error thrown by every API call. `status` is 0 for network problems. */
export class ApiError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError;
export const isNotFound = (err: unknown) => isApiError(err) && err.status === 404;

const BASE_URL = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const TIMEOUT_MS = 20_000;

interface RequestOptions {
	signal?: AbortSignal;
	params?: Record<string, string | number | boolean>;
}

function offlineMessage() {
	return typeof navigator !== 'undefined' && navigator.onLine === false
		? 'You are offline'
		: 'Could not reach the server';
}

function statusMessage(status: number, body: unknown): string {
	if (body && typeof body === 'object') {
		const { message, title } = body as { message?: unknown; title?: unknown };
		if (typeof message === 'string' && message) return message;
		if (typeof title === 'string' && title) return title;
	}
	if (status === 401) return 'Please sign in again';
	if (status === 403) return "You don't have access to this";
	if (status === 404) return 'Not found';
	if (status >= 500) return 'Something went wrong on the server';
	return `Request failed (${status})`;
}

async function send(
	method: string,
	path: string,
	body: unknown,
	options: RequestOptions,
	token: string | null,
): Promise<Response> {
	const url = new URL(BASE_URL + path, window.location.origin);
	for (const [k, v] of Object.entries(options.params ?? {})) url.searchParams.set(k, String(v));

	const headers: Record<string, string> = { Accept: 'application/json' };
	if (body !== undefined) headers['Content-Type'] = 'application/json';
	if (token) headers.Authorization = `Bearer ${token}`;

	// Abort on caller's signal (e.g. a query being cancelled) or on timeout.
	const controller = new AbortController();
	const timer = window.setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), TIMEOUT_MS);
	const onAbort = () => controller.abort(options.signal?.reason);
	if (options.signal?.aborted) onAbort();
	else options.signal?.addEventListener('abort', onAbort, { once: true });

	try {
		return await fetch(url, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: controller.signal,
		});
	} catch (err) {
		if (options.signal?.aborted) throw err; // cancelled by the caller — not an error to show
		if (err instanceof DOMException && err.name === 'TimeoutError') {
			throw new ApiError(0, 'The server took too long to respond');
		}
		throw new ApiError(0, offlineMessage());
	} finally {
		window.clearTimeout(timer);
		options.signal?.removeEventListener('abort', onAbort);
	}
}

async function parse(res: Response): Promise<unknown> {
	if (res.status === 204) return undefined;
	const text = await res.text();
	if (!text) return undefined;
	const type = res.headers.get('content-type') ?? '';
	if (type.includes('json')) {
		try {
			return JSON.parse(text);
		} catch {
			throw new ApiError(res.status || 0, 'Unexpected response from the server');
		}
	}
	// An HTML page instead of JSON (captive Wi-Fi portal, proxy error page)
	// must never reach components that expect objects or arrays.
	if (res.ok) throw new ApiError(0, 'Unexpected response from the server. Check your connection.');
	return text;
}

async function request<T>(
	method: string,
	path: string,
	body?: unknown,
	options: RequestOptions = {},
): Promise<{ data: T }> {
	let res = await send(method, path, body, options, await getIdToken());

	// The token was rejected: renew once and replay the request.
	if (res.status === 401) {
		const renewed = await refreshSession({ force: true }).catch(() => null);
		if (renewed?.id_token) res = await send(method, path, body, options, renewed.id_token);
	}

	const data = await parse(res);
	if (!res.ok) throw new ApiError(res.status, statusMessage(res.status, data));
	return { data: data as T };
}

export const api = {
	get: <T = unknown>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
	post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>('POST', path, body, options),
	put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
	delete: <T = unknown>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};

/** Guards list endpoints: anything but an array is treated as a server error. */
export function asArray<T>(data: unknown): T[] {
	if (Array.isArray(data)) return data as T[];
	throw new ApiError(0, 'Unexpected response from the server');
}
