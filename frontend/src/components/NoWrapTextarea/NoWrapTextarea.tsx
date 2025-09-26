import { useEffect, useRef, useState } from 'react';
import { Box, Textarea, type TextareaProps } from '@mantine/core';

type Props = TextareaProps & {
	widthPadding?: number;
};

export function NoWrapTextarea({
	widthPadding = 2,
	autosize = true,
	minRows = 1,
	maxRows = 12,
	styles,
	onChange,
	...props
}: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLTextAreaElement | null>(null);
	const [w, setW] = useState<string | number>('100%');

	const measure = () => {
		const el = inputRef.current;
		const container = containerRef.current;
		if (!el || !container) return;
		const contentW = el.scrollWidth + widthPadding;
		const maxW = container.clientWidth;
		setW(Math.min(contentW, maxW));
	};

	useEffect(() => {
		measure();
		const onResize = () => measure();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Box ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
			<Textarea
				ref={inputRef}
				autosize={autosize}
				minRows={minRows}
				maxRows={maxRows}
				onChange={(e) => {
					onChange?.(e);
					requestAnimationFrame(measure);
				}}
				styles={{
					input: {
						width: w,
						maxWidth: '100%',
						whiteSpace: 'nowrap',
						overflowX: 'auto',
						padding: '0.5rem',
					},
					...styles,
				}}
				{...props}
			/>
		</Box>
	);
}
