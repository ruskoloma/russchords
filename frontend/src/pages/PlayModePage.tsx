import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
	ActionIcon,
	Box,
	Button,
	Card,
	Group,
	Menu,
	ScrollArea,
	Text,
	Title,
	Tooltip,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconMinus,
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
	IconPlayerTrackNext,
	IconPlus,
	IconSettings,
	IconTextDecrease,
	IconTextIncrease,
	IconX,
} from '@tabler/icons-react';
import { usePlaylist } from '../api/playlists';
import { songQuery } from '../api/songs';
import { isNotFound } from '../api/client';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { NotFound } from '../components/NotFound';
import { SongSkeleton } from '../components/ListSkeleton';
import { SongSheet } from '../features/song/components/SongSheet';
import { parseSongText } from '../features/song/helpers/songParser';
import { useTransposition } from '../features/song/hooks/useTransposition';
import { clampFont, FONT_MAX, FONT_MIN, type SheetLayout } from '../features/song/hooks/useViewerPrefs';
import { usePlaySettings } from '../features/playmode/hooks/usePlaySettings';
import { useAutoScroll } from '../features/playmode/hooks/useAutoScroll';
import { useExitBlocker } from '../features/playmode/hooks/useExitBlocker';
import { useWakeLock } from '../features/playmode/hooks/useWakeLock';
import { useSwipeNavigation } from '../features/playmode/hooks/useSwipeNavigation';
import { PlaySettingsDrawer } from '../features/playmode/components/PlaySettingsDrawer';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePersistentState } from '../lib/storage';

const isTypingTarget = (target: EventTarget | null) => {
	const el = target as HTMLElement | null;
	return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
};

/** Forces the dark color scheme while mounted (without changing the saved preference). */
function useStageMode(enabled: boolean) {
	useEffect(() => {
		if (!enabled) return;
		const root = document.documentElement;
		const previous = root.getAttribute('data-mantine-color-scheme');
		root.setAttribute('data-mantine-color-scheme', 'dark');
		return () => {
			if (previous) root.setAttribute('data-mantine-color-scheme', previous);
		};
	}, [enabled]);
}

/**
 * Full-screen performance view of a playlist: one song at a time, big
 * thumb-reachable controls, per-song transpose, auto-scroll, swipe and
 * keyboard / page-turner pedal navigation. The current song is remembered,
 * so an accidental reload or exit resumes in the same place.
 */
export function PlayModePage() {
	const id = Number(useParams().id);
	const navigate = useNavigate();
	const { data: playlist, isPending, error, refetch } = usePlaylist(id);
	const entries = useMemo(() => playlist?.songs ?? [], [playlist]);
	const songQueries = useQueries({ queries: entries.map((s) => songQuery(s.id)) });

	const [storedIndex, setStoredIndex] = usePersistentState(`russchords:play:${id}`, 0, {
		kind: 'session',
		sanitize: (raw) => (typeof raw === 'number' && raw >= 0 ? Math.floor(raw) : 0),
	});
	const index = Math.min(storedIndex, Math.max(entries.length - 1, 0));
	const entry = entries[index];
	const songState = songQueries[index];
	const song = songState?.data;
	const nextEntry = entries[index + 1];

	const { settings, update, reset } = usePlaySettings();
	const [settingsOpened, settingsDrawer] = useDisclosure(false);
	const [scrolling, setScrolling] = useState(settings.autoScrollEnabled);
	const [effectiveFont, setEffectiveFont] = useState(settings.fontSize);
	const isWide = useMediaQuery('(min-width: 48em)', true, { getInitialValueInEffect: false });
	const hasKeyboard = useMediaQuery('(pointer: fine)', true, { getInitialValueInEffect: false });
	const layout: SheetLayout = isWide ? settings.layout : 'single';

	const lines = useMemo(() => parseSongText(song?.content ?? ''), [song?.content]);
	const hasChords = useMemo(() => lines.some((l) => l.type === 'chords'), [lines]);
	const t = useTransposition(lines, song?.rootNote, song ? `russchords:key:song:${song.id}` : undefined);

	usePageTitle(entry ? `${entry.name} · ${playlist?.title ?? ''}` : playlist?.title);
	useWakeLock(true);
	useStageMode(settings.stageMode);
	const { markExplicitExit } = useExitBlocker();

	const goTo = useCallback(
		(next: number) => {
			if (next < 0 || next >= entries.length) return;
			setStoredIndex(next);
		},
		[entries.length, setStoredIndex],
	);
	const next = useCallback(() => goTo(index + 1), [goTo, index]);
	const prev = useCallback(() => goTo(index - 1), [goTo, index]);

	// New song: back to the top, auto-scroll per preference.
	useEffect(() => {
		window.scrollTo({ top: 0 });
		setScrolling(settings.autoScrollEnabled);
		// Only when the song changes, not when the preference is toggled.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [index, id]);

	useAutoScroll({
		running: scrolling && Boolean(song),
		speed: settings.autoScrollSpeed,
		onEnd: () => setScrolling(false),
	});
	useSwipeNavigation({ onSwipeLeft: next, onSwipeRight: prev, enabled: !settingsOpened });

	const smaller = useCallback(
		() => update({ fontSize: clampFont(Math.min(settings.fontSize, effectiveFont) - 1) }),
		[update, settings.fontSize, effectiveFont],
	);
	const larger = useCallback(() => {
		if (effectiveFont < settings.fontSize)
			update({ fitWidth: false, fontSize: clampFont(Math.floor(effectiveFont) + 1) });
		else update({ fontSize: clampFont(settings.fontSize + 1) });
	}, [update, settings.fontSize, effectiveFont]);

	// Keyboard + Bluetooth page-turner pedals.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
			const page = () => window.innerHeight * 0.8;
			switch (e.key) {
				case 'ArrowRight':
					e.preventDefault();
					next();
					break;
				case 'ArrowLeft':
					e.preventDefault();
					prev();
					break;
				case 'PageDown':
				case ' ':
					e.preventDefault();
					window.scrollBy({ top: page(), behavior: 'smooth' });
					break;
				case 'PageUp':
					e.preventDefault();
					window.scrollBy({ top: -page(), behavior: 'smooth' });
					break;
				case '+':
				case '=':
					larger();
					break;
				case '-':
					smaller();
					break;
				case 'a':
				case 'A':
					setScrolling((s) => !s);
					break;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [next, prev, larger, smaller]);

	const exit = () => {
		markExplicitExit();
		navigate(`/playlist/${id}`);
	};

	if (isPending) {
		return (
			<Box p="md" maw={900} mx="auto">
				<SongSkeleton />
			</Box>
		);
	}
	if (error) {
		return isNotFound(error) ? (
			<NotFound title="Playlist not found" />
		) : (
			<ErrorState error={error} onRetry={() => void refetch()} />
		);
	}
	if (entries.length === 0) {
		return (
			<EmptyState
				title="This playlist is empty"
				description="Add songs to the playlist first."
				action={<Button onClick={exit}>Back to playlist</Button>}
			/>
		);
	}

	const bigButton = 52;

	return (
		<Box>
			{/* ---------------- top bar ---------------- */}
			<div className="play-topbar">
				<Group h={56} px="xs" gap={4} wrap="nowrap">
					<Tooltip label="Exit play mode">
						<ActionIcon size="xl" onClick={exit} aria-label="Exit play mode">
							<IconX size={22} />
						</ActionIcon>
					</Tooltip>

					<Menu position="bottom" width={320} shadow="lg">
						<Menu.Target>
							<UnstyledButton
								aria-label="Choose song"
								style={{ flex: 1, minWidth: 0, borderRadius: 'var(--mantine-radius-md)' }}
								px="xs"
								py={4}
							>
								<Group gap={6} wrap="nowrap" justify="center">
									<div style={{ minWidth: 0, textAlign: 'center' }}>
										<Text size="xs" c="dimmed" fw={600} lh={1.2} truncate>
											{index + 1} / {entries.length} · {playlist.title}
										</Text>
										<Text fw={700} truncate lh={1.3}>
											{entry?.name}
										</Text>
									</div>
									<IconChevronDown size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
								</Group>
							</UnstyledButton>
						</Menu.Target>
						<Menu.Dropdown>
							<ScrollArea.Autosize mah="60vh">
								{entries.map((s, i) => (
									<Menu.Item
										key={s.id}
										onClick={() => goTo(i)}
										leftSection={
											<Text size="sm" c="dimmed" w={22} ta="right">
												{i + 1}
											</Text>
										}
										rightSection={i === index ? <IconCheck size={16} /> : null}
										fw={i === index ? 700 : 500}
										bg={i === index ? 'var(--mantine-primary-color-light)' : undefined}
									>
										{s.name}
									</Menu.Item>
								))}
							</ScrollArea.Autosize>
						</Menu.Dropdown>
					</Menu>

					<Group gap={2} wrap="nowrap">
						<ActionIcon size="xl" onClick={smaller} disabled={effectiveFont <= FONT_MIN} aria-label="Smaller text">
							<IconTextDecrease size={20} />
						</ActionIcon>
						<ActionIcon size="xl" onClick={larger} disabled={effectiveFont >= FONT_MAX} aria-label="Larger text">
							<IconTextIncrease size={20} />
						</ActionIcon>
						<ActionIcon size="xl" onClick={settingsDrawer.open} aria-label="Play settings">
							<IconSettings size={20} />
						</ActionIcon>
					</Group>
				</Group>
			</div>

			{/* ---------------- song ---------------- */}
			<Box
				px={{ base: 'md', sm: 'xl' }}
				pt="md"
				maw={layout === 'single' ? 960 : 1440}
				mx="auto"
				style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom))' }}
			>
				<Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
					<div style={{ minWidth: 0 }}>
						<Title order={2} style={{ overflowWrap: 'anywhere' }}>
							{song?.name ?? entry?.name}
						</Title>
						{(song?.artist ?? entry?.artist) && <Text c="dimmed">{song?.artist ?? entry?.artist}</Text>}
					</div>
					{hasChords && (
						<Text fw={700} ff="monospace" size="lg" c="var(--chord-color)" style={{ flexShrink: 0 }}>
							{t.key}
						</Text>
					)}
				</Group>

				{song?.description?.trim() && (
					<Text size="sm" c="dimmed" mb="sm" style={{ whiteSpace: 'pre-wrap' }}>
						{song.description}
					</Text>
				)}

				{song ? (
					<SongSheet
						lines={lines}
						transpose={t.transpose}
						hideChords={settings.hideChords}
						fontSize={settings.fontSize}
						fitWidth={settings.fitWidth}
						layout={layout}
						onEffectiveFontSize={setEffectiveFont}
					/>
				) : songState?.error ? (
					isNotFound(songState.error) ? (
						<Text c="dimmed" py="xl">
							This song is no longer available.
						</Text>
					) : (
						<ErrorState error={songState.error} onRetry={() => void songState.refetch()} />
					)
				) : (
					<SongSkeleton />
				)}

				{nextEntry && (
					<Card
						component="button"
						type="button"
						onClick={next}
						mt="xl"
						w="100%"
						ta="left"
						className="clickable-card"
						style={{ borderColor: 'var(--mantine-primary-color-light-color)', cursor: 'pointer' }}
						aria-label={`Next song: ${nextEntry.name}`}
					>
						<Group justify="space-between" wrap="nowrap">
							<div style={{ minWidth: 0 }}>
								<Text size="xs" c="dimmed" fw={700} tt="uppercase">
									Up next
								</Text>
								<Text fw={700} truncate>
									{nextEntry.name}
								</Text>
								{nextEntry.artist && (
									<Text size="sm" c="dimmed" truncate>
										{nextEntry.artist}
									</Text>
								)}
							</div>
							<IconPlayerTrackNext size={24} style={{ color: 'var(--mantine-primary-color-filled)', flexShrink: 0 }} />
						</Group>
					</Card>
				)}
			</Box>

			{/* ---------------- bottom bar ---------------- */}
			<div className="play-bottombar">
				<Group h={72} px="sm" justify="space-between" wrap="nowrap" maw={720} mx="auto" gap="xs">
					{isWide ? (
						<Button
							size="lg"
							variant="default"
							leftSection={<IconChevronLeft size={20} />}
							onClick={prev}
							disabled={index === 0}
						>
							Previous
						</Button>
					) : (
						<ActionIcon
							size={bigButton}
							variant="default"
							onClick={prev}
							disabled={index === 0}
							aria-label="Previous song"
						>
							<IconChevronLeft size={26} />
						</ActionIcon>
					)}

					<Group gap={6} wrap="nowrap">
						{hasChords && (
							<Group gap={2} wrap="nowrap">
								<ActionIcon size="xl" variant="default" onClick={t.down} aria-label="Transpose down">
									<IconMinus size={18} />
								</ActionIcon>
								<UnstyledButton
									onClick={t.isTransposed ? t.reset : undefined}
									aria-label={t.isTransposed ? `Key ${t.key}, tap to reset to ${t.baseKey}` : `Key ${t.key}`}
									w={44}
									ta="center"
								>
									<Text fw={800} ff="monospace" lh={1.1}>
										{t.key}
									</Text>
									<Text size="10px" c="dimmed" lh={1.1}>
										{t.isTransposed ? `from ${t.baseKey}` : 'key'}
									</Text>
								</UnstyledButton>
								<ActionIcon size="xl" variant="default" onClick={t.up} aria-label="Transpose up">
									<IconPlus size={18} />
								</ActionIcon>
							</Group>
						)}
						<Tooltip label={scrolling ? 'Pause auto-scroll' : 'Start auto-scroll'}>
							<ActionIcon
								size={bigButton}
								radius="xl"
								variant={scrolling ? 'filled' : 'light'}
								color="brand"
								onClick={() => setScrolling((s) => !s)}
								aria-label={scrolling ? 'Pause auto-scroll' : 'Start auto-scroll'}
								aria-pressed={scrolling}
							>
								{scrolling ? <IconPlayerPauseFilled size={22} /> : <IconPlayerPlayFilled size={22} />}
							</ActionIcon>
						</Tooltip>
					</Group>

					{isWide ? (
						<Button
							size="lg"
							variant={nextEntry ? 'filled' : 'default'}
							rightSection={<IconChevronRight size={20} />}
							onClick={next}
							disabled={!nextEntry}
						>
							Next
						</Button>
					) : (
						<ActionIcon
							size={bigButton}
							color="brand"
							variant={nextEntry ? 'filled' : 'default'}
							onClick={next}
							disabled={!nextEntry}
							aria-label="Next song"
						>
							<IconChevronRight size={26} />
						</ActionIcon>
					)}
				</Group>
			</div>

			<PlaySettingsDrawer
				opened={settingsOpened}
				onClose={settingsDrawer.close}
				settings={settings}
				onChange={update}
				onReset={reset}
				onReload={() => {
					void refetch();
					songQueries.forEach((q) => void q.refetch());
				}}
				canUseColumns={Boolean(isWide)}
				showShortcuts={Boolean(hasKeyboard)}
			/>
		</Box>
	);
}
