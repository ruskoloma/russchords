import { type ChordToken, type Line, renderChordLine } from '../../helpers/songParser.ts';
import { Box, Text } from '@mantine/core';

interface ViewerBaseProps {
	content: Array<Line>;
	hideChords?: boolean;
	transposeChord?: (t: ChordToken) => ChordToken;
	fontSize?: number;
}

export const ViewerBase: React.FC<ViewerBaseProps> = ({
	content,
	hideChords = false,
	transposeChord,
	fontSize = 16,
}) => {
	return (
		<Box component="pre" ff="text" fz={fontSize}>
			{content.map((line, i) => {
				if (line.type === 'chords') {
					if (hideChords) {
						return <></>;
					}
					return (
						<Text key={i} c="blue.8" component="div" size={fontSize + 'px'}>
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
};
