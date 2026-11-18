import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { confirmAction } from '../components/confirm';

/**
 * Warns before leaving a page with unsaved changes — both for in-app
 * navigation (confirm dialog) and for closing/reloading the tab.
 *
 * Call `allowNextNavigation()` right before navigating away on purpose
 * (e.g. after a successful save).
 */
export function useUnsavedChangesGuard(dirty: boolean, message: string) {
	const bypass = useRef(false);
	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			dirty && !bypass.current && currentLocation.pathname !== nextLocation.pathname,
	);

	const blockerRef = useRef(blocker);
	blockerRef.current = blocker;

	useEffect(() => {
		if (blocker.state !== 'blocked') return;
		void confirmAction({ title: 'Leave this page?', message, confirmLabel: 'Leave' }).then((ok) => {
			const current = blockerRef.current;
			if (current.state !== 'blocked') return;
			if (ok) current.proceed();
			else current.reset();
		});
	}, [blocker.state, message]);

	useEffect(() => {
		if (!dirty) return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (bypass.current) return;
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);

	return {
		allowNextNavigation: useCallback(() => {
			bypass.current = true;
		}, []),
	};
}
