import { useEffect, useRef } from 'react';

interface Options {
	running: boolean;
	/** Pixels per second. */
	speed: number;
	/** Called when the bottom of the page is reached. */
	onEnd?: () => void;
}

/**
 * Hands-free scrolling for the song sheet using requestAnimationFrame.
 * Sub-pixel progress is accumulated so slow speeds stay smooth on
 * high-DPI screens (where scrollTop rounds to device pixels).
 */
export function useAutoScroll({ running, speed, onEnd }: Options) {
	const onEndRef = useRef(onEnd);
	onEndRef.current = onEnd;

	useEffect(() => {
		if (!running || speed <= 0) return;
		const el = document.scrollingElement ?? document.documentElement;
		let raf = 0;
		let last: number | null = null;
		let position = el.scrollTop;

		const tick = (now: number) => {
			if (last !== null) {
				// The user may have scrolled manually — continue from there.
				if (Math.abs(el.scrollTop - position) > 2) position = el.scrollTop;
				position += (speed * (now - last)) / 1000;
				const max = el.scrollHeight - el.clientHeight;
				if (position >= max) {
					el.scrollTop = max;
					onEndRef.current?.();
					return;
				}
				el.scrollTop = position;
			}
			last = now;
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [running, speed]);
}
