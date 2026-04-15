import { memo } from 'react';
import { type ChordToken, type Line, renderChordLine } from '../../helpers/songParser.ts';
import { Box, Text } from '@mantine/core';

interface ViewerBaseProps {
	content: Array<Line>;
	hideChords?: boolean;
	transposeChord?: (t: ChordToken) => ChordToken;
	fontSize?: number;
}

/**
 * Pure chord/lyric renderer. Memoized because its parent (Viewer) re-renders
 * on key change, font-size change, etc. — and the chord content map is the
 * most expensive visual work on a song page. Pair this memo with stable
 * callbacks in Viewer (see `handleTransposeChord` wrapped in useCallback).
 */
export const ViewerBase: React.FC<ViewerBaseProps> = memo(function ViewerBase({
	content,
	hideChords = false,
	transposeChord,
	fontSize = 16,
}) {
	return (
		<Box
			component="pre"
			ff="monospace"
			fz={fontSize}
			style={{
				maxWidth: '100%',
				overflowX: 'auto',
			}}
			pb={'1rem'}
		>
			{content.map((line, i) => {
				if (line.type === 'chords') {
					if (hideChords) {
						return <></>;
					}
					return (
						<Text key={i} c="chord.7" component="div" size={fontSize + 'px'}>
							{renderChordLine(line.tokens.map((t) => transposeChord?.(t) ?? t))}
						</Text>
					);
				} else if (line.type === 'header') {
					return (
						<Box key={i} mt="sm" fw="bold">
							{line.content}
						</Box>
					);
				} else if (line.type === 'empty') {
					return <Box key={i}>&nbsp;</Box>;
				} else {
					return <Box key={i}>{line.content}</Box>;
				}
			})}
		</Box>
	);
});
