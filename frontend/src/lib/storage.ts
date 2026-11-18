import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Storage helpers that never throw. Private windows, blocked site data and
 * full quotas all make Web Storage throw; none of that should break the app,
 * so every access is wrapped and falls back to in-memory behaviour.
 */

export type StorageKind = 'local' | 'session';

function getStore(kind: StorageKind): Storage | null {
	try {
		return kind === 'local' ? window.localStorage : window.sessionStorage;
	} catch {
		return null;
	}
}

export function readJSON<T>(key: string, fallback: T, kind: StorageKind = 'local'): T {
	try {
		const raw = getStore(kind)?.getItem(key);
		if (raw == null) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function writeJSON(key: string, value: unknown, kind: StorageKind = 'local'): void {
	try {
		getStore(kind)?.setItem(key, JSON.stringify(value));
	} catch {
		// Quota exceeded / storage blocked — preferences simply won't persist.
	}
}

export function removeKey(key: string, kind: StorageKind = 'local'): void {
	try {
		getStore(kind)?.removeItem(key);
	} catch {
		// ignore
	}
}

/** Removes every key that starts with `prefix`. */
export function removeKeysWithPrefix(prefix: string, kind: StorageKind = 'local'): void {
	const store = getStore(kind);
	if (!store) return;
	try {
		const keys: string[] = [];
		for (let i = 0; i < store.length; i++) {
			const k = store.key(i);
			if (k && k.startsWith(prefix)) keys.push(k);
		}
		keys.forEach((k) => store.removeItem(k));
	} catch {
		// ignore
	}
}

/**
 * `useState` backed by Web Storage. `sanitize` receives whatever was stored
 * (possibly written by an older app version) and must return a valid value.
 * Local-storage values stay in sync across tabs.
 */
export function usePersistentState<T>(
	key: string,
	defaultValue: T,
	options: { kind?: StorageKind; sanitize?: (raw: unknown) => T } = {},
): [T, (next: T | ((prev: T) => T)) => void] {
	const { kind = 'local' } = options;
	const sanitizeRef = useRef(options.sanitize);
	sanitizeRef.current = options.sanitize;

	const read = useCallback((): T => {
		const raw = readJSON<unknown>(key, undefined, kind);
		if (raw === undefined) return defaultValue;
		const sanitize = sanitizeRef.current;
		return sanitize ? sanitize(raw) : (raw as T);
		// defaultValue is intentionally read once per key.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, kind]);

	const [value, setValue] = useState<T>(read);

	// Re-read when the key changes (e.g. per-song state).
	const lastKey = useRef(key);
	useEffect(() => {
		if (lastKey.current === key) return;
		lastKey.current = key;
		setValue(read());
	}, [key, read]);

	useEffect(() => {
		if (kind !== 'local') return;
		const onStorage = (e: StorageEvent) => {
			if (e.key === key) setValue(read());
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, [key, kind, read]);

	const update = useCallback(
		(next: T | ((prev: T) => T)) => {
			setValue((prev) => {
				const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
				writeJSON(key, resolved, kind);
				return resolved;
			});
		},
		[key, kind],
	);

	return [value, update];
}
