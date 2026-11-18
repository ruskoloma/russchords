import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { confirmAction } from '../../../components/confirm';

/**
 * Asks before leaving play mode through in-app navigation (e.g. the phone's
 * back gesture mid-song). Reloading is harmless — the position is restored —
 * so there is no beforeunload prompt. `markExplicitExit` skips the question
 * when the user pressed the exit button.
 */
export function useExitBlocker() {
	const explicit = useRef(false);
	const blocker = useBlocker(
		({ currentLocation, nextLocation }) => !explicit.current && currentLocation.pathname !== nextLocation.pathname,
	);
	const blockerRef = useRef(blocker);
	blockerRef.current = blocker;

	useEffect(() => {
		if (blocker.state !== 'blocked') return;
		void confirmAction({
			title: 'Leave play mode?',
			message: 'You can come back to the same song later.',
			confirmLabel: 'Leave',
		}).then((ok) => {
			const current = blockerRef.current;
			if (current.state !== 'blocked') return;
			if (ok) current.proceed();
			else current.reset();
		});
	}, [blocker.state]);

	return {
		markExplicitExit: useCallback(() => {
			explicit.current = true;
		}, []),
	};
}
