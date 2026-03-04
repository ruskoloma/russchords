import { type ChordToken, type Line, renderChordLine } from '../../helpers/songParser.ts';
import { Box, Text } from '@mantine/core';

export type ViewerLayoutMode = 'single' | 'columns-song' | 'columns-sections';

interface ViewerBaseProps {
	content: Array<Line>;
	hideChords?: boolean;
	transposeChord?: (t: ChordToken) => ChordToken;
	fontSize?: number;
	layoutMode?: ViewerLayoutMode;
}

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

	return [lines.slice(0, best), lines.slice(best)];
}

function splitIntoSections(lines: Line[]): Line[][] {
	if (lines.length === 0) return [];
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
	const leftTrimmed = [...left];
	const rightTrimmed = [...right];

	while (leftTrimmed.length > 0 && leftTrimmed[leftTrimmed.length - 1].type === 'empty') {
		leftTrimmed.pop();
	}
	while (rightTrimmed.length > 0 && rightTrimmed[0].type === 'empty') {
		rightTrimmed.shift();
	}

	return [leftTrimmed, rightTrimmed];
}

function findSectionSplitIndex(lines: Line[]): number {
	if (lines.length < 2) return lines.length;

	const target = Math.ceil(lines.length / 2);
	const min = 1;
	const max = lines.length - 1;

	const isForbidden = (idx: number) => lines[idx - 1]?.type === 'chords' && lines[idx]?.type === 'text';
	const inRange = (idx: number) => idx >= min && idx <= max;

	if (!isForbidden(target)) return target;

	for (let delta = 1; delta < lines.length; delta++) {
		const right = target + delta;
		if (inRange(right) && !isForbidden(right)) return right;

		const left = target - delta;
		if (inRange(left) && !isForbidden(left)) return left;
	}

	return target;
}

function trimSectionTrailingEmptyLines(lines: Line[]): Line[] {
	const out = [...lines];
	while (out.length > 0 && out[out.length - 1].type === 'empty') {
		out.pop();
	}
	return out;
}

export const ViewerBase: React.FC<ViewerBaseProps> = ({
	content,
	hideChords = false,
	transposeChord,
	fontSize = 16,
	layoutMode = 'single',
}) => {
	const renderLines = (lines: Array<Line>, keyPrefix: string) =>
		lines.map((line, i) => {
			if (line.type === 'chords') {
				if (hideChords) return null;
				return (
					<Text key={`${keyPrefix}-c-${i}`} c="blue.8" component="div" size={`${fontSize}px`}>
						{renderChordLine(line.tokens.map((t) => transposeChord?.(t) ?? t))}
					</Text>
				);
			}
			if (line.type === 'header') {
				return (
					<Box key={`${keyPrefix}-h-${i}`} mt="sm" fw="bold">
						{line.content}
					</Box>
				);
			}
			if (line.type === 'empty') {
				return <Box key={`${keyPrefix}-e-${i}`}>&nbsp;</Box>;
			}
			return <Box key={`${keyPrefix}-t-${i}`}>{line.content}</Box>;
		});

	const renderColumn = (lines: Array<Line>, key: string) => (
		<Box
			key={key}
			component="pre"
			ff="text"
			fz={fontSize}
			style={{
				maxWidth: '100%',
				overflowX: 'auto',
			}}
			pb="1rem"
		>
			{renderLines(lines, key)}
		</Box>
	);

	if (layoutMode === 'columns-song') {
		const [left, right] = splitLinesBalanced(content);
		return (
			<Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
				{renderColumn(left, 'song-left')}
				{renderColumn(right, 'song-right')}
			</Box>
		);
	}

	if (layoutMode === 'columns-sections') {
		const sections = splitIntoSections(content);
		return (
			<Box>
				{sections.map((section, idx) => {
					const header = section[0]?.type === 'header' ? section[0] : null;
					const bodyRaw = header ? section.slice(1) : section;
					const body = trimSectionTrailingEmptyLines(bodyRaw);
					const splitAt = findSectionSplitIndex(body);
					const [leftBodyRaw, rightBodyRaw] = [body.slice(0, splitAt), body.slice(splitAt)];
					const [leftBody, rightBody] = trimSplitGap(leftBodyRaw, rightBodyRaw);
					const shouldSplit = rightBody.length > 0;

					if (!shouldSplit) {
						return (
							<Box key={`sec-${idx}-single-wrap`}>
								{header ? (
									<Box mt="sm" fw="bold">
										{header.content}
									</Box>
								) : null}
								{renderColumn(leftBody, `sec-${idx}-single`)}
							</Box>
						);
					}

					return (
						<Box key={`sec-${idx}`}>
							{header ? (
								<Box mt="sm" fw="bold">
									{header.content}
								</Box>
							) : null}
							<Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
								{renderColumn(leftBody, `sec-${idx}-left`)}
								{renderColumn(rightBody, `sec-${idx}-right`)}
							</Box>
						</Box>
					);
				})}
			</Box>
		);
	}

	return (
		<Box>
			{renderColumn(content, 'single')}
		</Box>
	);
};
