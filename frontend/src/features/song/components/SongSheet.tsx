import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { type ChordToken, type Line, renderChordLine } from '../helpers/songParser';
import { FONT_MIN, type SheetLayout } from '../hooks/useViewerPrefs';

interface SongSheetProps {
	lines: Line[];
	transpose?: (token: ChordToken) => ChordToken;
	hideChords?: boolean;
	fontSize?: number;
	layout?: SheetLayout;
	/** Shrink the font (never grow it) so the widest line fits. */
	fitWidth?: boolean;
	/** Reports the font size actually used (smaller than `fontSize` when fitted). */
	onEffectiveFontSize?: (size: number) => void;
}

/** JetBrains Mono advance width is 600/1000 em. */
const MONO_CHAR_EM = 0.6;
const COLUMN_GAP_PX = 32;

// ---------------------------------------------------------------------------
// Column splitting
// ---------------------------------------------------------------------------

function splitLinesBalanced(lines: Line[]): [Line[], Line[]] {
	if (lines.length < 2) return [lines, []];
	const target = Math.ceil(lines.length / 2);
	let best = target;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let i = 1; i < lines.length; i++) {
		const prev = lines[i - 1];
		const curr = lines[i];
		const isBoundary = prev.type === 'empty' || curr.type === 'header' || curr.type === 'empty';
		if (!isBoundary) continue;
		const distance = Math.abs(i - target);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = i;
		}
	}
	return trimSplitGap(lines.slice(0, best), lines.slice(best));
}

function splitIntoSections(lines: Line[]): Line[][] {
	const sections: Line[][] = [];
	let current: Line[] = [];
	for (const line of lines) {
		if (line.type === 'header' && current.length > 0) {
			sections.push(current);
			current = [line];
		} else {
			current.push(line);
		}
	}
	if (current.length > 0) sections.push(current);
	return sections;
}

function trimSplitGap(left: Line[], right: Line[]): [Line[], Line[]] {
	const l = [...left];
	const r = [...right];
	while (l.length > 0 && l[l.length - 1].type === 'empty') l.pop();
	while (r.length > 0 && r[0].type === 'empty') r.shift();
	return [l, r];
}

/** Middle split point that never separates a chord line from its lyric line. */
function findSectionSplitIndex(lines: Line[]): number {
	if (lines.length < 2) return lines.length;
	const target = Math.ceil(lines.length / 2);
	const isForbidden = (idx: number) => lines[idx - 1]?.type === 'chords' && lines[idx]?.type === 'text';
	const inRange = (idx: number) => idx >= 1 && idx <= lines.length - 1;
	if (!isForbidden(target)) return target;
	for (let d = 1; d < lines.length; d++) {
		if (inRange(target + d) && !isForbidden(target + d)) return target + d;
		if (inRange(target - d) && !isForbidden(target - d)) return target - d;
	}
	return target;
}

function trimTrailingEmpty(lines: Line[]): Line[] {
	const out = [...lines];
	while (out.length > 0 && out[out.length - 1].type === 'empty') out.pop();
	return out;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function lineText(line: Line, transpose?: (t: ChordToken) => ChordToken): string {
	switch (line.type) {
		case 'chords':
			return renderChordLine(transpose ? line.tokens.map(transpose) : line.tokens);
		case 'header':
		case 'text':
			return line.content;
		default:
			return '';
	}
}

/** "Verse 1:" → "Verse 1" (the colon is only a marker for the parser). */
const headerLabel = (text: string) => text.replace(/:\s*$/, '');

function renderLines(lines: Line[], hideChords: boolean, transpose?: (t: ChordToken) => ChordToken): ReactNode[] {
	const out: ReactNode[] = [];
	lines.forEach((line, i) => {
		if (line.type === 'chords') {
			if (hideChords) return;
			out.push(
				<div key={i} className="song-sheet__chords">
					{lineText(line, transpose) || ' '}
				</div>,
			);
		} else if (line.type === 'header') {
			out.push(
				<div key={i} className="song-sheet__header" role="heading" aria-level={3}>
					{headerLabel(line.content)}
				</div>,
			);
		} else if (line.type === 'empty') {
			out.push(<div key={i}>{' '}</div>);
		} else {
			out.push(<div key={i}>{line.content}</div>);
		}
	});
	return out;
}

/**
 * Pure chord-sheet renderer (monospace so chords stay above their syllables).
 * Memoized: parents re-render on unrelated state, the sheet only when its
 * inputs change.
 */
export const SongSheet = memo(function SongSheet({
	lines,
	transpose,
	hideChords = false,
	fontSize = 16,
	layout = 'single',
	fitWidth = false,
	onEffectiveFontSize,
}: SongSheetProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(0);

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el || !fitWidth) return;
		setWidth(el.clientWidth);
		const observer = new ResizeObserver((entries) => {
			const w = entries[0]?.contentRect.width;
			if (w) setWidth(w);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [fitWidth]);

	const widestLine = useMemo(() => {
		let max = 0;
		for (const line of lines) {
			if (hideChords && line.type === 'chords') continue;
			if (line.type === 'header') continue;
			max = Math.max(max, lineText(line, transpose).replace(/\s+$/, '').length);
		}
		return max;
	}, [lines, transpose, hideChords]);

	const columns = layout !== 'single';
	const columnWidth = columns ? (width - COLUMN_GAP_PX) / 2 : width;
	const fitted =
		fitWidth && width > 0 && widestLine > 0
			? Math.max(FONT_MIN, Math.floor((columnWidth / (widestLine * MONO_CHAR_EM)) * 10) / 10)
			: fontSize;
	const effectiveSize = Math.min(fontSize, fitted);

	useLayoutEffect(() => {
		onEffectiveFontSize?.(effectiveSize);
	}, [effectiveSize, onEffectiveFontSize]);

	const sheet = (part: Line[], key: string) => (
		<pre key={key} className="song-sheet" style={{ fontSize: effectiveSize }}>
			{renderLines(part, hideChords, transpose)}
		</pre>
	);

	let body: ReactNode;
	if (layout === 'columns-song') {
		const [left, right] = splitLinesBalanced(lines);
		body = (
			<div className="song-columns">
				{sheet(left, 'left')}
				{sheet(right, 'right')}
			</div>
		);
	} else if (layout === 'columns-sections') {
		body = splitIntoSections(lines).map((section, idx) => {
			const header = section[0]?.type === 'header' ? section[0] : null;
			const bodyLines = trimTrailingEmpty(header ? section.slice(1) : section);
			const at = findSectionSplitIndex(bodyLines);
			const [left, right] = trimSplitGap(bodyLines.slice(0, at), bodyLines.slice(at));
			return (
				<div key={idx} style={{ marginBottom: '0.75em' }}>
					{header && (
						<div className="song-section-heading" style={{ fontSize: effectiveSize * 0.8 }}>
							{headerLabel(header.content)}
						</div>
					)}
					{right.length > 0 ? (
						<div className="song-columns">
							{sheet(left, 'l')}
							{sheet(right, 'r')}
						</div>
					) : (
						sheet(left, 's')
					)}
				</div>
			);
		});
	} else {
		body = sheet(lines, 'single');
	}

	return (
		<div ref={containerRef} style={{ minWidth: 0 }}>
			{body}
		</div>
	);
});
