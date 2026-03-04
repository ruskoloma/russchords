import { ActionIcon, Box, Button, Group, Menu, NumberInput, Stack, Switch, Text } from '@mantine/core';
import { useLocalStorage, useMediaQuery } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import {
	IconChevronLeft,
	IconChevronRight,
	IconColumns2,
	IconColumns3,
	IconDotsVertical,
	IconList,
	IconRefresh,
	IconSettings,
	IconX,
} from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type LoaderFunction, redirect, useBlocker, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { type ViewerLayoutMode, ViewerBase } from '../../components/Viewer/ViewerBase';
import { myFetch } from '../../helpers/api';
import { parseSongText } from '../../helpers/songParser';
import type { MyPlaylistDto, SongDto } from '../../types';

interface PlayModeData {
	playlist: MyPlaylistDto;
	songs: SongDto[];
}

export const playlistPlayModeLoader: LoaderFunction = async ({ params }) => {
	try {
		const client = await myFetch();
		const { data: playlist } = await client.get<MyPlaylistDto>(`/playlist/${params.id}`);

		const songParams = playlist.songs.map((s) => s.id);
		// Fetch all songs in parallel
		// Note: For very large playlists this might need chunking, but for now assuming reasonable size
		const songPromises = songParams.map((id) =>
			client
				.get<SongDto>(`/song/${id}`)
				.then((res) => res.data)
				.catch((e) => {
					console.error(`Failed to load song ${id}`, e);
					return null;
				}),
		);

		const songsRaw = await Promise.all(songPromises);
		const songs = songsRaw.filter((s): s is SongDto => s !== null);

		return { playlist, songs };
	} catch (err) {
		if (axios.isAxiosError(err)) {
			const status = err.response?.status;
			if (status === 401) return redirect('/auth/login');
			if (status === 404) throw new Response('Not found', { status: 404 });
		}
		throw err;
	}
};

interface PlayModeSettings {
	fontSize: number;
	hideChords: boolean;
	layoutMode: ViewerLayoutMode;
}

export const PlaylistPlayMode: React.FC = () => {
	const { playlist, songs } = useLoaderData() as PlayModeData;
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const isTablet = useMediaQuery('(min-width: 48em)');

	const [currentIndex, setCurrentIndex] = useState(0);
	const isExplicitExit = useRef(false);

	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			!isExplicitExit.current && currentLocation.pathname !== nextLocation.pathname,
	);

	useEffect(() => {
		if (blocker.state === 'blocked') {
			modals.openConfirmModal({
				title: 'Exit Play Mode?',
				children: <Text size="sm">Are you sure you want to stop playback?</Text>,
				labels: { confirm: 'Exit', cancel: 'Stay' },
				confirmProps: { color: 'red' },
				onConfirm: () => blocker.proceed(),
				onCancel: () => blocker.reset(),
			});
		}
	}, [blocker]);

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (!isExplicitExit.current) {
				e.preventDefault();
				e.returnValue = ''; // Standard for Chrome
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, []);

	const [settings, setSettings] = useLocalStorage<PlayModeSettings>({
		key: 'russchords-playmode-settings',
		defaultValue: {
			fontSize: 18,
			hideChords: false,
			layoutMode: 'single',
		},
	});

	const cycleLayout = () => {
		setSettings((prev) => {
			const mode = prev.layoutMode ?? 'single';
			const next = mode === 'single' ? 'columns-song' : mode === 'columns-song' ? 'columns-sections' : 'single';
			return { ...prev, layoutMode: next };
		});
	};

	const currentLayoutMode = settings.layoutMode ?? 'single';
	const layoutLabel =
		currentLayoutMode === 'single'
			? 'Layout: Mobile'
			: currentLayoutMode === 'columns-song'
				? 'Layout: 2 Columns'
				: 'Layout: Section Split';
	const layoutColor = currentLayoutMode === 'single' ? 'gray' : currentLayoutMode === 'columns-song' ? 'blue' : 'teal';
	const effectiveLayoutMode: ViewerLayoutMode = isTablet ? currentLayoutMode : 'single';

	// Ensure currentIndex is valid if songs change
	useEffect(() => {
		if (currentIndex >= songs.length && songs.length > 0) {
			setCurrentIndex(songs.length - 1);
		}
	}, [songs.length, currentIndex]);

	const currentSong = songs[currentIndex];

	const parsedContent = useMemo(() => {
		if (!currentSong) return [];
		return parseSongText(currentSong.content);
	}, [currentSong]);

	const handleNext = () => {
		if (currentIndex < songs.length - 1) {
			setCurrentIndex(currentIndex + 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const handlePrev = () => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};



	if (!currentSong) {
		return (
			<Stack align="center" mt="xl">
				<Text>No songs loaded.</Text>
				<Button onClick={() => revalidator.revalidate()} leftSection={<IconRefresh size={16} />}>
					Retry
				</Button>
				<Button
					variant="subtle"
					onClick={() => {
						isExplicitExit.current = true;
						setTimeout(() => navigate(`/playlist/${playlist.playlistId}`), 0);
					}}
				>
					Go Back
				</Button>
			</Stack>
		);
	}

	return (
		<Stack gap={0}>
			{/* Top Bar */}
			<Group
				justify="space-between"
				p="xs"
				bg="gray.0"
				style={{
					borderBottom: '1px solid var(--mantine-color-gray-3)',
					position: 'sticky',
					top: 0,
					zIndex: 10,
				}}
				wrap="nowrap"
				m="-1rem -1rem 0"
			>
				<Group gap={4} wrap="nowrap">
					<Menu shadow="md" width={250} position="bottom-start">
						<Menu.Target>
							<ActionIcon variant="subtle" color="gray">
								<IconDotsVertical size={24} />
							</ActionIcon>
						</Menu.Target>

						<Menu.Dropdown>
							<Menu.Item
								leftSection={<IconX size={14} />}
								color="red"
								onClick={() => {
									isExplicitExit.current = true;
									setTimeout(() => navigate(`/playlist/${playlist.playlistId}`), 0);
								}}
							>
								Exit Play Mode
							</Menu.Item>
							<Menu.Divider />
							<Menu.Label>Settings</Menu.Label>
							{isTablet && (
								<Menu.Item
									color={layoutColor}
									leftSection={
										currentLayoutMode === 'single' ? (
											<IconList size={14} />
										) : currentLayoutMode === 'columns-song' ? (
											<IconColumns2 size={14} />
										) : (
											<IconColumns3 size={14} />
										)
									}
									onClick={cycleLayout}
								>
									{layoutLabel}
								</Menu.Item>
							)}
							<Menu.Item leftSection={<IconSettings size={14} />} closeMenuOnClick={false}>
								<Stack gap="xs">
									<Group justify="space-between">
										<Text size="sm">Font Size</Text>
										<NumberInput
											size="xs"
											w={60}
											value={settings.fontSize}
											onChange={(v) => setSettings({ ...settings, fontSize: Number(v) })}
											min={10}
											max={40}
										/>
									</Group>
									<Group justify="space-between">
										<Text size="sm">Hide Chords</Text>
										<Switch
											size="xs"
											checked={settings.hideChords}
											onChange={(e) => setSettings({ ...settings, hideChords: e.currentTarget.checked })}
										/>
									</Group>
								</Stack>
							</Menu.Item>

							<Menu.Divider />

							<Menu.Item leftSection={<IconRefresh size={14} />} onClick={() => revalidator.revalidate()}>
								Sync / Reload
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>

					<ActionIcon
						variant="subtle"
						color="gray"
						onClick={handlePrev}
						disabled={currentIndex === 0}
						aria-label="Previous song"
					>
						<IconChevronLeft size={24} />
					</ActionIcon>
				</Group>

				<Menu shadow="md" width={300} position="bottom">
					<Menu.Target>
						<Button
							variant="subtle"
							c="dark"
							fw={700}
							size="md"
							style={{ flex: 1, textAlign: 'center', height: 'auto', minWidth: 0 }}
						>
							<Text truncate>{`${currentIndex + 1}. ${currentSong.name}`}</Text>
						</Button>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Label>Select Song</Menu.Label>
						<Box maw={300} mah={300} style={{ overflowY: 'auto' }}>
							{songs.map((s, i) => (
								<Menu.Item
									key={s.id}
									onClick={() => {
										setCurrentIndex(i);
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}}
									bg={i === currentIndex ? 'blue.0' : undefined}
								>
									{i + 1}. {s.name}
								</Menu.Item>
							))}
						</Box>
					</Menu.Dropdown>
				</Menu>

				<ActionIcon
					variant="subtle"
					color="gray"
					onClick={handleNext}
					disabled={currentIndex === songs.length - 1}
					aria-label="Next song"
				>
					<IconChevronRight size={24} />
				</ActionIcon>
			</Group>

			{/* Main Content (Scrollable) */}
			<Box style={{ flex: 1, overflowY: 'auto' }} id="scrollable-content" mb={'4em'}>
				<Box maw={effectiveLayoutMode === 'single' ? '750px' : '1280px'} mx="auto">
					<ViewerBase
						content={parsedContent}
						fontSize={settings.fontSize}
						hideChords={settings.hideChords}
						layoutMode={effectiveLayoutMode}
					/>
				</Box>
			</Box>
		</Stack>
	);
};
