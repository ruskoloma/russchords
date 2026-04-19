import { useEffect } from 'react';
import axios from 'axios';
import { type LoaderFunction, redirect, useLoaderData, useNavigate } from 'react-router-dom';
import { Box, Button, Group, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import { myFetch } from '../../lib/api';
import { ViewerBase } from '../../features/song/components/Viewer/ViewerBase';
import { parseSongText } from '../../features/song/helpers/songParser';
import type { MyPlaylistDto, SongDto } from '../../types';

interface PrintData {
	playlist: MyPlaylistDto;
	songs: SongDto[];
}

export const playlistPrintPageLoader: LoaderFunction = async ({ params }) => {
	try {
		const client = await myFetch();
		const { data: playlist } = await client.get<MyPlaylistDto>(`/playlist/${params.id}`);

		// Fetch every song in parallel — same pattern as PlaylistPlayMode loader.
		const songPromises = playlist.songs.map((s) =>
			client
				.get<SongDto>(`/song/${s.id}`)
				.then((res) => res.data)
				.catch(() => null),
		);
		const songsRaw = await Promise.all(songPromises);
		const songs = songsRaw.filter((s): s is SongDto => s !== null);

		return { playlist, songs } satisfies PrintData;
	} catch (err) {
		if (axios.isAxiosError(err)) {
			const status = err.response?.status;
			if (status === 401) return redirect('/auth/login');
			if (status === 404) throw new Response('Not found', { status: 404 });
		}
		throw err;
	}
};

/**
 * Print-friendly view of an entire playlist. Visual chrome (sidebar,
 * header, screen-only buttons) is stripped via `@media print` CSS rules
 * loaded from the PrintStyles style tag below. Each song renders on its
 * own page with a forced page break between songs.
 *
 * Users click "Print / Save as PDF" and pick "Save as PDF" from the
 * browser's print dialog for a portable setlist export. No additional
 * JavaScript bundle needed.
 */
export const PlaylistPrintPage: React.FC = () => {
	const { playlist, songs } = useLoaderData() as PrintData;
	const navigate = useNavigate();

	// Open the browser print dialog automatically on first mount so users
	// land straight in "ready to print / save as PDF" state. A tiny delay
	// gives the font + CSS a beat to settle before the dialog snapshots.
	useEffect(() => {
		const id = setTimeout(() => window.print(), 400);
		return () => clearTimeout(id);
	}, []);

	return (
		<>
			<PrintStyles />

			{/* Screen-only toolbar — hidden in print via `.no-print` */}
			<Group justify="space-between" mb="lg" className="no-print">
				<Button
					variant="subtle"
					leftSection={<IconArrowLeft size={16} />}
					onClick={() => navigate(`/playlist/${playlist.playlistId}`)}
				>
					Back to playlist
				</Button>
				<Button leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
					Print / Save as PDF
				</Button>
			</Group>

			{/* Cover page */}
			<Stack gap="md" className="print-cover">
				<Title order={1}>{playlist.title}</Title>
				{playlist.description && <Text c="dimmed">{playlist.description}</Text>}
				<Text size="sm" c="dimmed">
					{songs.length} song{songs.length === 1 ? '' : 's'}
				</Text>
				<Stack gap={4} mt="md">
					{songs.map((s, i) => (
						<Text key={s.id}>
							<strong>{i + 1}.</strong> {s.name}
							{s.artist ? ` — ${s.artist}` : ''}
							{s.rootNote ? ` (${s.rootNote})` : ''}
						</Text>
					))}
				</Stack>
			</Stack>

			{/* Songs — one per printed page */}
			{songs.map((song) => (
				<Box key={song.id} className="print-song">
					<Title order={2}>{song.name}</Title>
					{song.artist && (
						<Text c="dimmed" mb="xs">
							{song.artist}
							{song.rootNote ? ` · ${song.rootNote}` : ''}
						</Text>
					)}
					<ViewerBase content={parseSongText(song.content)} fontSize={14} />
				</Box>
			))}
		</>
	);
};

/**
 * Print-specific CSS rules. Kept inline as a `<style>` tag so they live
 * in the same module as the page and don't leak to other routes.
 */
function PrintStyles() {
	return (
		<style>{`
			.print-cover,
			.print-song {
				break-after: page;
				page-break-after: always;
			}
			.print-song:last-child,
			.print-cover:last-child {
				break-after: auto;
				page-break-after: auto;
			}
			@media print {
				/* Hide the app shell — nav, header, color-scheme toggle — when printing. */
				.mantine-AppShell-header,
				.mantine-AppShell-navbar,
				.no-print {
					display: none !important;
				}
				.mantine-AppShell-main {
					padding: 0 !important;
				}
				body {
					background: white !important;
					color: black !important;
				}
			}
		`}</style>
	);
}
