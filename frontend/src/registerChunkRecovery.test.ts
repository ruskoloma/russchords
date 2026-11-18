import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerChunkRecovery } from './registerChunkRecovery';

describe('failed lazy route recovery', () => {
	const reload = vi.fn();
	const assign = vi.fn();
	let unregister: () => void;

	beforeEach(() => {
		sessionStorage.clear();
		vi.stubGlobal('location', { reload, assign, pathname: '/', search: '', hash: '' });
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
		unregister = registerChunkRecovery();
	});

	afterEach(() => {
		unregister();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		reload.mockClear();
		assign.mockClear();
	});

	it('reloads the current URL once after a failed dynamic import', () => {
		const event = new Event('vite:preloadError', { cancelable: true });
		window.dispatchEvent(event);
		window.dispatchEvent(new Event('vite:preloadError'));

		expect(reload).toHaveBeenCalledTimes(1);
		// Preserve normal error handling if recovery fails.
		expect(event.defaultPrevented).toBe(false);
	});

	it('does not enter a reload loop if the same bundle still fails after reload', () => {
		window.dispatchEvent(new Event('vite:preloadError'));
		unregister();
		unregister = registerChunkRecovery();
		window.dispatchEvent(new Event('vite:preloadError'));

		expect(reload).toHaveBeenCalledTimes(1);
	});

	it('opens the requested route if its lazy import fails before the URL is committed', () => {
		unregister();
		unregister = registerChunkRecovery(() => '/search?q=grace#results');
		window.dispatchEvent(new Event('vite:preloadError'));

		expect(assign).toHaveBeenCalledWith('/search?q=grace#results');
		expect(reload).not.toHaveBeenCalled();
	});

	it('reloads in place if the requested route is already the current URL', () => {
		unregister();
		unregister = registerChunkRecovery(() => '/');
		window.dispatchEvent(new Event('vite:preloadError'));

		expect(reload).toHaveBeenCalledTimes(1);
		expect(assign).not.toHaveBeenCalled();
	});

	it('preserves offline pages and allows recovery after reconnecting', () => {
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
		window.dispatchEvent(new Event('vite:preloadError'));
		expect(reload).not.toHaveBeenCalled();

		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
		window.dispatchEvent(new Event('vite:preloadError'));
		expect(reload).toHaveBeenCalledTimes(1);
	});

	it('keeps the error boundary available when storage is blocked', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Storage is blocked', 'SecurityError');
		});
		window.dispatchEvent(new Event('vite:preloadError'));
		expect(reload).not.toHaveBeenCalled();
	});

	it('does not reload for unrelated application errors', () => {
		window.dispatchEvent(new Event('error'));
		expect(reload).not.toHaveBeenCalled();
	});
});
