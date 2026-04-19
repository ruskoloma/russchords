import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';

/**
 * Guards a full-screen play-mode session from accidental navigation.
 *
 * Two sources of "oops, I meant to stay":
 *   1. In-app navigation (back button, side nav click): caught via
 *      `useBlocker`, which pops a Mantine confirm modal.
 *   2. Browser tab close or hard reload: caught via `beforeunload`.
 *
 * The `isExplicitExit` ref lets callers opt out *without* the modal when the
 * user explicitly chose "exit play mode" from within the UI — otherwise
 * clicking the in-UI exit would still trigger the confirmation.
 */
export function useExitBlocker() {
	const isExplicitExit = useRef(false);

	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			!isExplicitExit.current && currentLocation.pathname !== nextLocation.pathname,
	);

	useEffect(() => {
		if (blocker.state !== 'blocked') return;
		modals.openConfirmModal({
			title: 'Exit Play Mode?',
			children: <Text size="sm">Are you sure you want to stop playback?</Text>,
			labels: { confirm: 'Exit', cancel: 'Stay' },
			confirmProps: { color: 'red' },
			onConfirm: () => blocker.proceed?.(),
			onCancel: () => blocker.reset?.(),
		});
	}, [blocker]);

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (!isExplicitExit.current) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, []);

	const markExplicitExit = useCallback(() => {
		isExplicitExit.current = true;
	}, []);

	return { markExplicitExit };
}
