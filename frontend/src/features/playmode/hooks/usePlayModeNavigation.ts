import { useCallback, useEffect, useState } from 'react';

interface Options {
	total: number;
}

/**
 * Owns the "which song am I playing?" pointer for play mode plus the
 * navigation helpers. Also wires up keyboard arrow-key shortcuts — arrow
 * left / right jump between songs, matching the on-screen buttons.
 *
 * Scroll-to-top on song change is centralized here so every path that
 * advances the index gets it for free.
 */
export function usePlayModeNavigation({ total }: Options) {
	const [currentIndex, setCurrentIndex] = useState(0);

	// If the playlist shrinks under our feet (mutation during revalidation),
	// clamp the pointer instead of crashing on `songs[undefined]`.
	useEffect(() => {
		if (total === 0) return;
		if (currentIndex >= total) setCurrentIndex(total - 1);
	}, [total, currentIndex]);

	const scrollToTop = useCallback(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	const goTo = useCallback(
		(index: number) => {
			if (index < 0 || index >= total) return;
			setCurrentIndex(index);
			scrollToTop();
		},
		[total, scrollToTop],
	);

	const handleNext = useCallback(() => {
		setCurrentIndex((prev) => {
			if (prev < total - 1) {
				scrollToTop();
				return prev + 1;
			}
			return prev;
		});
	}, [total, scrollToTop]);

	const handlePrev = useCallback(() => {
		setCurrentIndex((prev) => {
			if (prev > 0) {
				scrollToTop();
				return prev - 1;
			}
			return prev;
		});
	}, [scrollToTop]);

	// Keyboard shortcuts. Active only while the play-mode page is mounted.
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			// Don't hijack keys when the user is typing into a form field.
			const target = e.target as HTMLElement | null;
			if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
				return;
			}
			if (e.key === 'ArrowRight') {
				e.preventDefault();
				handleNext();
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				handlePrev();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [handleNext, handlePrev]);

	return {
		currentIndex,
		goTo,
		handleNext,
		handlePrev,
		isFirst: currentIndex === 0,
		isLast: currentIndex >= total - 1,
	};
}
