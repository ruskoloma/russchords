import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
	enabled: boolean;
	/** Pixels per second. 0 = disabled. Typical range 10–80. */
	speed: number;
	/** DOM element to scroll. Usually `window`; pass a specific element for a scoped scroll. */
	target?: HTMLElement | null;
}

/**
 * Smoothly auto-scrolls a scrollable container at a configurable pixel-per-
 * second rate using requestAnimationFrame. Designed for hands-off lyric
 * scrolling during a worship set — the performer enables it, then the
 * content scrolls itself while they play.
 *
 * Behavior:
 *  - `running` flag toggles the RAF loop without re-creating it.
 *  - `togglePause` lets callers wire up a tap-to-pause interaction.
 *  - Stops automatically at the bottom of the scrollable area.
 *
 * The hook uses a `useRef` for the last frame time so the effect doesn't
 * re-run on every tick.
 */
export function useAutoScroll({ enabled, speed, target }: Options) {
	const [running, setRunning] = useState(false);
	const rafRef = useRef<number | null>(null);
	const lastTimeRef = useRef<number | null>(null);

	const getScrollContainer = useCallback(() => {
		if (target) return target;
		return document.scrollingElement ?? document.documentElement;
	}, [target]);

	useEffect(() => {
		// Auto-start when enabled goes true, auto-stop when false.
		setRunning(enabled);
	}, [enabled]);

	useEffect(() => {
		if (!running || speed <= 0) {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			lastTimeRef.current = null;
			return;
		}

		const tick = (now: number) => {
			const container = getScrollContainer();
			if (!container) {
				rafRef.current = requestAnimationFrame(tick);
				return;
			}
			const last = lastTimeRef.current ?? now;
			const dt = (now - last) / 1000;
			lastTimeRef.current = now;

			const next = container.scrollTop + speed * dt;
			const maxScroll = container.scrollHeight - container.clientHeight;

			if (next >= maxScroll) {
				container.scrollTop = maxScroll;
				setRunning(false);
				return;
			}
			container.scrollTop = next;
			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			lastTimeRef.current = null;
		};
	}, [running, speed, getScrollContainer]);

	const togglePause = useCallback(() => setRunning((r) => !r), []);

	return { running, togglePause };
}
