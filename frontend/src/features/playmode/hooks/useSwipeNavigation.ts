import { useEffect, useRef } from 'react';

interface Options {
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	/** Minimum horizontal distance in pixels to count as a swipe. */
	threshold?: number;
	/** Maximum vertical distance — beyond this, treat as a scroll rather than a swipe. */
	verticalTolerance?: number;
}

/**
 * Lightweight touch-swipe navigation hook. Listens for touchstart → touchend
 * on the window, measures horizontal delta, and fires the appropriate
 * callback when the gesture clearly qualifies as a horizontal swipe.
 *
 * Writing this by hand keeps the bundle clean of an extra dep
 * (`react-swipeable` is ~4KB) and lets us tune the thresholds to the
 * play-mode use case — a performer glancing away mid-song shouldn't
 * accidentally advance to the next one, so the defaults are deliberately
 * conservative (80px horizontal, max 60px vertical).
 */
export function useSwipeNavigation({
	onSwipeLeft,
	onSwipeRight,
	threshold = 80,
	verticalTolerance = 60,
}: Options) {
	const startRef = useRef<{ x: number; y: number; time: number } | null>(null);

	useEffect(() => {
		const onTouchStart = (e: TouchEvent) => {
			const t = e.touches[0];
			if (!t) return;
			startRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
		};

		const onTouchEnd = (e: TouchEvent) => {
			const start = startRef.current;
			startRef.current = null;
			if (!start) return;
			const t = e.changedTouches[0];
			if (!t) return;

			const dx = t.clientX - start.x;
			const dy = t.clientY - start.y;
			const absDx = Math.abs(dx);
			const absDy = Math.abs(dy);

			// Require clearly horizontal intent so users can still vertically
			// scroll the lyric content without accidentally triggering a nav.
			if (absDx < threshold) return;
			if (absDy > verticalTolerance) return;

			// Ignore swipes that took too long — those are usually accidental
			// drags or hesitant touch-scrolls.
			if (Date.now() - start.time > 500) return;

			if (dx < 0) onSwipeLeft?.();
			else onSwipeRight?.();
		};

		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchend', onTouchEnd, { passive: true });
		return () => {
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchend', onTouchEnd);
		};
	}, [onSwipeLeft, onSwipeRight, threshold, verticalTolerance]);
}
