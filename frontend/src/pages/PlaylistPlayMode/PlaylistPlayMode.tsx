import { useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import { type LoaderFunction, redirect, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { Box, Button, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconRefresh } from '@tabler/icons-react';
import { type ViewerLayoutMode, ViewerBase } from '../../features/song/components/Viewer/ViewerBase';
import { myFetch } from '../../lib/api';
import { parseSongText } from '../../features/song/helpers/songParser';
import type { MyPlaylistDto, SongDto } from '../../types';
import type { PlayModeData } from '../../features/playmode/types';
import { usePlayModeSettings } from '../../features/playmode/hooks/usePlayModeSettings';
import { usePlayModeNavigation } from '../../features/playmode/hooks/usePlayModeNavigation';
import { useExitBlocker } from '../../features/playmode/hooks/useExitBlocker';
import { useWakeLock } from '../../features/playmode/hooks/useWakeLock';
import { useAutoScroll } from '../../features/playmode/hooks/useAutoScroll';
import { useSwipeNavigation } from '../../features/playmode/hooks/useSwipeNavigation';
import { PlayModeTopBar } from '../../features/playmode/components/PlayModeTopBar';
import { UpNextCard } from '../../features/playmode/components/UpNextCard';
import { KeyboardShortcutsOverlay } from '../../features/playmode/components/KeyboardShortcutsOverlay';

export const playlistPlayModeLoader: LoaderFunction = async ({ params }) => {
	try {
		const client = await myFetch();
		const { data: playlist } = await client.get<MyPlaylistDto>(`/playlist/${params.id}`);

		// Fetch every song in parallel. For very large playlists this may need
		// chunking, but at typical worship-set size (10-30 songs) this is fine.
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
 * over `features/playmode/*`: navigation, settings, exit blocker, wake
 * lock, auto-scroll, and the top-bar component all live under that folder.
 */
export const PlaylistPlayMode: React.FC = () => {
	const { playlist, songs } = useLoaderData() as PlayModeData;
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const isTablet = useMediaQuery('(min-width: 48em)');

	const nav = usePlayModeNavigation({ total: songs.length });
	const {
		settings,
		setFontSize,
		setHideChords,
		setAutoScrollSpeed,
		setAutoScrollEnabled,
		setStageMode,
		setLayoutMode,
		reset,
	} = usePlayModeSettings();
	const { markExplicitExit } = useExitBlocker();

	useWakeLock(true);
	useAutoScroll({ enabled: settings.autoScrollEnabled, speed: settings.autoScrollSpeed });
	useSwipeNavigation({ onSwipeLeft: nav.handleNext, onSwipeRight: nav.handlePrev });

	useEffect(() => {
		if (!settings.stageMode) return;
		const prev = document.documentElement.getAttribute('data-mantine-color-scheme');
		document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
		return () => {
			if (prev) {
				document.documentElement.setAttribute('data-mantine-color-scheme', prev);
			}
		};
	}, [settings.stageMode]);

	const currentSong = songs[nav.currentIndex];
	const nextSong = songs[nav.currentIndex + 1] ?? null;
	const parsedContent = useMemo(
		() => (currentSong ? parseSongText(currentSong.content) : []),
		[currentSong],
	);
	const effectiveLayoutMode: ViewerLayoutMode = isTablet ? settings.layoutMode : 'single';

	const handleExit = useCallback(() => {
		markExplicitExit();
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
				isLayoutSwitchEnabled={Boolean(isTablet)}
				onPrev={nav.handlePrev}
				onNext={nav.handleNext}
				onPick={nav.goTo}
				onFontSizeChange={setFontSize}
				onHideChordsChange={setHideChords}
				onAutoScrollEnabledChange={setAutoScrollEnabled}
				onAutoScrollSpeedChange={setAutoScrollSpeed}
				onStageModeChange={setStageMode}
				onLayoutModeChange={setLayoutMode}
				onResetSettings={reset}
				onSyncReload={handleSyncReload}
				onExit={handleExit}
			/>

			<Box style={{ flex: 1, overflowY: 'auto' }} id="scrollable-content" mb="4em">
				<Box maw={effectiveLayoutMode === 'single' ? 820 : 1280} mx="auto">
					<ViewerBase
						content={parsedContent}
						fontSize={settings.fontSize}
						hideChords={settings.hideChords}
						layoutMode={effectiveLayoutMode}
					/>
					<UpNextCard nextSong={nextSong} onAdvance={nav.handleNext} />
				</Box>
			</Box>

			<KeyboardShortcutsOverlay />
		</Stack>
	);
};
