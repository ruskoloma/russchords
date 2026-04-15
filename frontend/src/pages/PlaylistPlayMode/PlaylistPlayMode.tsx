import { useCallback, useMemo } from 'react';
import axios from 'axios';
import { type LoaderFunction, redirect, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { Box, Button, Stack, Text } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { ViewerBase } from '../../features/song/components/Viewer/ViewerBase';
import { myFetch } from '../../lib/api';
import { parseSongText } from '../../features/song/helpers/songParser';
import type { MyPlaylistDto, SongDto } from '../../types';
import type { PlayModeData } from '../../features/playmode/types';
import { usePlayModeSettings } from '../../features/playmode/hooks/usePlayModeSettings';
import { usePlayModeNavigation } from '../../features/playmode/hooks/usePlayModeNavigation';
import { useExitBlocker } from '../../features/playmode/hooks/useExitBlocker';
import { PlayModeTopBar } from '../../features/playmode/components/PlayModeTopBar';

export const playlistPlayModeLoader: LoaderFunction = async ({ params }) => {
	try {
		const client = await myFetch();
		const { data: playlist } = await client.get<MyPlaylistDto>(`/playlist/${params.id}`);

		// Fetch every song in parallel. For very large playlists this may need
		// chunking, but at typical worship-set size (10–30 songs) this is fine.
		const songPromises = playlist.songs.map((s) =>
			client
				.get<SongDto>(`/song/${s.id}`)
				.then((res) => res.data)
				.catch((e) => {
					console.error(`Failed to load song ${s.id}`, e);
					return null;
				}),
		);

		const songsRaw = await Promise.all(songPromises);
		const songs = songsRaw.filter((s): s is SongDto => s !== null);

		return { playlist, songs } satisfies PlayModeData;
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
 * Immersive full-screen play mode. The page itself is a thin composition
 * over `features/playmode/*` — navigation, settings, exit-blocker, and the
 * top-bar component all live under that feature folder.
 */
export const PlaylistPlayMode: React.FC = () => {
	const { playlist, songs } = useLoaderData() as PlayModeData;
	const navigate = useNavigate();
	const revalidator = useRevalidator();

	const nav = usePlayModeNavigation({ total: songs.length });
	const { settings, setFontSize, setHideChords } = usePlayModeSettings();
	const { markExplicitExit } = useExitBlocker();

	const currentSong = songs[nav.currentIndex];
	const parsedContent = useMemo(
		() => (currentSong ? parseSongText(currentSong.content) : []),
		[currentSong],
	);

	const handleExit = useCallback(() => {
		markExplicitExit();
		// defer so any pending state flushes before the navigation fires
		setTimeout(() => navigate(`/playlist/${playlist.playlistId}`), 0);
	}, [markExplicitExit, navigate, playlist.playlistId]);

	const handleSyncReload = useCallback(() => {
		revalidator.revalidate();
	}, [revalidator]);

	if (!currentSong) {
		return (
			<Stack align="center" mt="xl">
				<Text>No songs loaded.</Text>
				<Button onClick={handleSyncReload} leftSection={<IconRefresh size={16} />}>
					Retry
				</Button>
				<Button variant="subtle" onClick={handleExit}>
					Go Back
				</Button>
			</Stack>
		);
	}

	return (
		<Stack gap={0}>
			<PlayModeTopBar
				songs={songs}
				currentIndex={nav.currentIndex}
				isFirst={nav.isFirst}
				isLast={nav.isLast}
				settings={settings}
				onPrev={nav.handlePrev}
				onNext={nav.handleNext}
				onPick={nav.goTo}
				onFontSizeChange={setFontSize}
				onHideChordsChange={setHideChords}
				onSyncReload={handleSyncReload}
				onExit={handleExit}
			/>

			{/* Main content — scrollable chord/lyric body */}
			<Box style={{ flex: 1, overflowY: 'auto' }} id="scrollable-content" mb={'4em'}>
				<Box maw={820} mx="auto">
					<ViewerBase content={parsedContent} fontSize={settings.fontSize} hideChords={settings.hideChords} />
				</Box>
			</Box>
		</Stack>
	);
};
