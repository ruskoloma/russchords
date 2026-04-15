import { ActionIcon, Box, Button, Group, Menu, NumberInput, Stack, Switch, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { IconChevronLeft, IconChevronRight, IconDotsVertical, IconRefresh, IconSettings, IconX } from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type LoaderFunction, redirect, useBlocker, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { ViewerBase } from '../../features/song/components/Viewer/ViewerBase';
import { myFetch } from '../../lib/api';
import { parseSongText } from '../../features/song/helpers/songParser';
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
}

export const PlaylistPlayMode: React.FC = () => {
	const { playlist, songs } = useLoaderData() as PlayModeData;
	const navigate = useNavigate();
	const revalidator = useRevalidator();

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
		},
	});

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
				style={{
					backgroundColor: 'var(--mantine-color-body)',
					borderBottom: '1px solid var(--mantine-color-default-border)',
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
							color="gray"
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
									style={
										i === currentIndex
											? { backgroundColor: 'var(--mantine-color-brand-light)', fontWeight: 600 }
											: undefined
									}
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
				<Box maw={820} mx="auto">
					<ViewerBase content={parsedContent} fontSize={settings.fontSize} hideChords={settings.hideChords} />
				</Box>
			</Box>
		</Stack>
	);
};
