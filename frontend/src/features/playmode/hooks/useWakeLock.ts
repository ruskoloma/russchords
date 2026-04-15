import { useEffect } from 'react';

/**
 * Requests a screen wake lock for the lifetime of the calling component.
 * Prevents phones / tablets from dimming or sleeping during a worship set —
 * critical UX for live performance when the performer can't reach over to
 * tap the screen between songs.
 *
 * Gracefully no-ops on browsers that don't support the Wake Lock API
 * (e.g. iOS Safari <16.4, Firefox desktop). There's no visible fallback;
 * users on unsupported platforms will just experience the default idle
 * behavior as before.
 *
 * The lock is also re-acquired when the document becomes visible again
 * after backgrounding, because the browser auto-releases wake locks when
 * the tab is hidden.
 */
export function useWakeLock(enabled: boolean = true) {
	useEffect(() => {
		if (!enabled) return;
		if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

		// Cast via unknown because the TypeScript DOM lib types for Wake Lock
		// vary across versions and we don't want to pull @types/wicg-* in.
		const nav = navigator as unknown as {
			wakeLock: {
				request: (type: 'screen') => Promise<{ release: () => Promise<void> }>;
			};
		};

		let sentinel: { release: () => Promise<void> } | null = null;
		let cancelled = false;

		const acquire = async () => {
			try {
				const lock = await nav.wakeLock.request('screen');
				if (cancelled) {
					void lock.release();
					return;
				}
				sentinel = lock;
			} catch (err) {
				// Permission denied, feature blocked, document hidden — log once
				// and continue. Failure to acquire the lock is not fatal.
				console.warn('[useWakeLock] could not acquire screen lock:', err);
			}
		};

		void acquire();

		const handleVisibility = () => {
			if (document.visibilityState === 'visible' && sentinel === null) {
				void acquire();
			}
		};
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			cancelled = true;
			document.removeEventListener('visibilitychange', handleVisibility);
			if (sentinel) void sentinel.release();
		};
	}, [enabled]);
}
