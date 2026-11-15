// import.meta.url changes with the production bundle hash. Persist the guard
// across reloads, but let a later deployment recover independently.
const recoveryKey = `russchords:chunk-recovery:${import.meta.url}`;

export function registerChunkRecovery(getNavigationUrl?: () => string) {
	let recovering = false;
	const onPreloadError = () => {
		if (recovering || !navigator.onLine) return;

		try {
			if (sessionStorage.getItem(recoveryKey)) return;
			sessionStorage.setItem(recoveryKey, '1');
		} catch {
			// Without a persistent guard, a broken deployment could reload forever.
			return;
		}

		recovering = true;
		const targetUrl = getNavigationUrl?.();
		const currentUrl = window.location.pathname + window.location.search + window.location.hash;
		if (targetUrl && targetUrl !== currentUrl) {
			// Router lazy imports can fail before the new URL is committed. Open
			// the requested route instead of reloading the page being left behind.
			window.location.assign(targetUrl);
		} else {
			window.location.reload();
		}
	};

	// Leave the original error intact so the route error boundary remains
	// available if the one recovery attempt cannot fix the failed import.
	window.addEventListener('vite:preloadError', onPreloadError);
	return () => window.removeEventListener('vite:preloadError', onPreloadError);
}
