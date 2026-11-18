import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ActionIcon, Box, Button, Card, Group, Menu, ScrollArea, Text, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
	IconAdjustments,
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
	IconPlayerTrackNext,
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
import { COLUMNS_MEDIA_QUERY, type SheetLayout } from '../features/song/hooks/useViewerPrefs';
import { useStageSettings } from '../features/stage/hooks/useStageSettings';
import { useAutoScroll } from '../features/stage/hooks/useAutoScroll';
import { useExitBlocker } from '../features/stage/hooks/useExitBlocker';
import { useWakeLock } from '../features/stage/hooks/useWakeLock';
import { useSwipeNavigation } from '../features/stage/hooks/useSwipeNavigation';
import { StageSettingsDrawer } from '../features/stage/components/StageSettingsDrawer';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePersistentState } from '../lib/storage';

const isTypingTarget = (target: EventTarget | null) => {
	const el = target as HTMLElement | null;
	return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
};

/** Taps on these never toggle the controls. */
const INTERACTIVE = 'button, a, input, textarea, select, label, [role="button"], [role="menuitem"]';

/** Forces the dark color scheme while mounted (without changing the saved preference). */
function useDarkScreen(enabled: boolean) {
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
 * Hides the Stage controls while the performer reads: once auto-scroll starts
 * or the page is scrolled down. A tap on the song brings them back; they also
 * come back at the very top of the page.
 */
function useControlsVisibility(pinned: boolean) {
	const [visible, setVisible] = useState(true);
	const anchor = useRef(0);

	useEffect(() => {
		// Distance is measured from the highest point since the last change, so
		// reading back up a little never brings the bars back by itself.
		anchor.current = window.scrollY;
		const onScroll = () => {
			const y = window.scrollY;
			if (y <= 8) {
				setVisible(true);
				anchor.current = y;
			} else if (y < anchor.current) {
				anchor.current = y;
			} else if (y - anchor.current > 48) {
				setVisible(false);
				anchor.current = y;
			}
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return { visible: visible || pinned, setVisible };
}

/**
 * Stage: full-screen performance view of a playlist, one song at a time.
 *
 * Built for focus and for not changing anything by accident: the screen shows
 * only the song, controls slide away while reading (tap to bring them back),
 * and the only things one tap can do are previous / next song and auto-scroll.
 * Key, text size and layout live in the settings panel. The current song is
 * remembered, so an accidental reload or exit resumes in the same place.
 */
export function StagePage() {
	const id = Number(useParams().id);
	const navigate = useNavigate();
	const { data: playlist, isPending, error, refetch } = usePlaylist(id);
	const entries = useMemo(() => playlist?.songs ?? [], [playlist]);
	const songQueries = useQueries({ queries: entries.map((s) => songQuery(s.id)) });

	const [storedIndex, setStoredIndex] = usePersistentState(`russchords:stage:${id}`, 0, {
		kind: 'session',
		sanitize: (raw) => (typeof raw === 'number' && raw >= 0 ? Math.floor(raw) : 0),
	});
	const index = Math.min(storedIndex, Math.max(entries.length - 1, 0));
	const entry = entries[index];
	const songState = songQueries[index];
	const song = songState?.data;
	const nextEntry = entries[index + 1];

	const { settings, update, reset } = useStageSettings();
	const [settingsOpened, settingsDrawer] = useDisclosure(false);
	const [songMenuOpened, setSongMenuOpened] = useState(false);
	const [scrolling, setScrolling] = useState(settings.autoScrollEnabled);
	const [effectiveFont, setEffectiveFont] = useState(settings.fontSize);
	const isWide = useMediaQuery(COLUMNS_MEDIA_QUERY, true, { getInitialValueInEffect: false });
	const hasKeyboard = useMediaQuery('(pointer: fine)', true, { getInitialValueInEffect: false });
	const layout: SheetLayout = isWide ? settings.layout : 'single';
	const controls = useControlsVisibility(settingsOpened || songMenuOpened);

	const lines = useMemo(() => parseSongText(song?.content ?? ''), [song?.content]);
	const hasChords = useMemo(() => lines.some((l) => l.type === 'chords'), [lines]);
	const t = useTransposition(lines, song?.rootNote, song ? `russchords:key:song:${song.id}` : undefined);

	usePageTitle(entry ? `${entry.name} · ${playlist?.title ?? ''}` : playlist?.title);
	useWakeLock(true);
	useDarkScreen(settings.darkScreen);
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

	const { setVisible: setControlsVisible } = controls;
	const toggleScrolling = useCallback(() => {
		if (!scrolling) setControlsVisible(false); // started: get out of the way
		setScrolling(!scrolling);
	}, [scrolling, setControlsVisible]);

	useAutoScroll({
		running: scrolling && Boolean(song),
		speed: settings.autoScrollSpeed,
		onEnd: () => {
			setScrolling(false);
			setControlsVisible(true); // end of the song: show Next
		},
	});
	useSwipeNavigation({ onSwipeLeft: next, onSwipeRight: prev, enabled: !settingsOpened && !songMenuOpened });

	// Keyboard + Bluetooth page-turner pedals. Nothing here changes the song.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (settingsOpened || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
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
				case 'a':
				case 'A':
					toggleScrolling();
					break;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [next, prev, toggleScrolling, settingsOpened]);

	const onContentClick = (e: MouseEvent<HTMLElement>) => {
		const target = e.target as Element;
		if (target.closest(INTERACTIVE)) return;
		if (window.getSelection()?.toString()) return;
		setControlsVisible(!controls.visible);
	};

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
	const hidden = !controls.visible;

	return (
		<Box className="stage" data-controls={hidden ? 'hidden' : 'visible'}>
			{/* ---------------- top bar ---------------- */}
			<div className="stage-bar stage-bar--top" inert={hidden} aria-hidden={hidden || undefined}>
				<Group h={56} px="xs" gap={4} wrap="nowrap">
					<ActionIcon size="xl" onClick={exit} aria-label="Exit Stage">
						<IconX size={22} />
					</ActionIcon>

					<Menu position="bottom" width={320} shadow="lg" opened={songMenuOpened} onChange={setSongMenuOpened}>
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

					<ActionIcon size="xl" onClick={settingsDrawer.open} aria-label="Stage settings">
						<IconAdjustments size={22} />
					</ActionIcon>
				</Group>
			</div>

			{/* ---------------- song ---------------- */}
			<Box
				className="stage-content"
				px={{ base: 'md', sm: 'xl' }}
				maw={layout === 'single' ? 960 : 1440}
				mx="auto"
				onClick={onContentClick}
			>
				<Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
					<div style={{ minWidth: 0 }}>
						<Title order={2} style={{ overflowWrap: 'anywhere' }}>
							{song?.name ?? entry?.name}
						</Title>
						{(song?.artist ?? entry?.artist) && <Text c="dimmed">{song?.artist ?? entry?.artist}</Text>}
					</div>
					{hasChords && (
						<div style={{ flexShrink: 0, textAlign: 'right' }}>
							<Text fw={700} ff="monospace" size="lg" c="var(--chord-color)" lh={1.2}>
								{t.key}
							</Text>
							{t.isTransposed && (
								<Text size="xs" c="dimmed">
									from {t.baseKey}
								</Text>
							)}
						</div>
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

			{/* Where am I in the set — visible only while the controls are hidden. */}
			<div className="stage-position" aria-hidden="true">
				{index + 1} / {entries.length}
				{scrolling && ' · auto'}
			</div>

			{/* ---------------- bottom bar ---------------- */}
			<div className="stage-bar stage-bar--bottom" inert={hidden} aria-hidden={hidden || undefined}>
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

					<ActionIcon
						size={bigButton}
						radius="xl"
						variant={scrolling ? 'filled' : 'light'}
						color="brand"
						onClick={toggleScrolling}
						aria-label={scrolling ? 'Pause auto-scroll' : 'Start auto-scroll'}
						aria-pressed={scrolling}
					>
						{scrolling ? <IconPlayerPauseFilled size={22} /> : <IconPlayerPlayFilled size={22} />}
					</ActionIcon>

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

			<StageSettingsDrawer
				opened={settingsOpened}
				onClose={settingsDrawer.close}
				settings={settings}
				onChange={update}
				onReset={reset}
				onReload={() => {
					void refetch();
					songQueries.forEach((q) => void q.refetch());
				}}
				songKey={hasChords && song ? t : null}
				songName={song?.name}
				effectiveFontSize={effectiveFont}
				canUseColumns={Boolean(isWide)}
				showShortcuts={Boolean(hasKeyboard)}
			/>
		</Box>
	);
}
