import { useMemo } from 'react';
import { SimpleGrid, Stack, Text } from '@mantine/core';
import { type Line, getChordRoot } from '../helpers/songParser';
import { lookupChordShape } from '../helpers/chordShapes';
import { ChordDiagram } from './ChordDiagram';

interface ChordDiagramsPanelProps {
	content: Line[];
}

/**
 * Extracts every unique chord from a parsed song and renders a grid of
 * chord-shape diagrams. Chords that don't have a known shape in the
 * hand-curated table are silently skipped.
 *
 * Used as the body of a "Chord diagrams" modal launched from the Viewer
 * overflow menu. Lets a guitarist glance at the full fingering set for
 * a song before starting to play.
 */
export function ChordDiagramsPanel({ content }: ChordDiagramsPanelProps) {
	const uniqueChords = useMemo(() => {
		const seen = new Set<string>();
		for (const line of content) {
			if (line.type !== 'chords') continue;
			for (const token of line.tokens) {
				if (!token.chord) continue;
				// Chord tokens may contain slashes for bass notes; normalize on
				// the main chord only so we don't show "G" and "G/B" as distinct.
				const main = token.chord.split('/')[0] ?? token.chord;
				if (getChordRoot(main)) seen.add(main);
			}
		}
		return [...seen];
	}, [content]);

	const withShapes = uniqueChords
		.map((name) => ({ name, shape: lookupChordShape(name) }))
		.filter((e): e is { name: string; shape: NonNullable<ReturnType<typeof lookupChordShape>> } => e.shape !== null);

	if (withShapes.length === 0) {
		return (
			<Text c="dimmed" size="sm">
				No matching chord shapes found for this song. The diagram database covers ~40 of the most common guitar
				chords — slash chords, jazz voicings, and unusual extensions fall back silently.
			</Text>
		);
	}

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				Showing {withShapes.length} unique chord{withShapes.length === 1 ? '' : 's'} used in this song.
			</Text>
			<SimpleGrid cols={{ base: 3, xs: 4, sm: 5 }} spacing="md">
				{withShapes.map(({ name, shape }) => (
					<Stack key={name} gap={4} align="center">
						<Text fw={600} size="sm">
							{name}
						</Text>
						<ChordDiagram shape={shape} />
					</Stack>
				))}
			</SimpleGrid>
		</Stack>
	);
}
