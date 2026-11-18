import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Menu,
	Stack,
	Text,
	TextInput,
	Textarea,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconCheck,
	IconCopy,
	IconDotsVertical,
	IconPencil,
	IconPin,
	IconPinFilled,
	IconPlayerPlayFilled,
	IconPlaylistAdd,
	IconPlaylistX,
	IconPlus,
	IconShare,
	IconTrash,
	IconX,
} from '@tabler/icons-react';
import {
	useDeletePlaylist,
	useJoinPlaylist,
	useLeavePlaylist,
	useMyPlaylists,
	usePlaylist,
	useSavePlaylist,
	useSetPlaylistPinned,
} from '../api/playlists';
import { songQuery } from '../api/songs';
import { isNotFound } from '../api/client';
import { queryClient } from '../app/queryClient';
import { useSession } from '../auth/useSession';
import { BackLink } from '../components/BackLink';
import { PageHeader } from '../components/PageHeader';
import { ListSkeleton } from '../components/ListSkeleton';
import { ErrorState } from '../components/ErrorState';
import { NotFound } from '../components/NotFound';
import { KeyBadge } from '../components/KeyBadge';
import { confirmAction } from '../components/confirm';
import { SongPickerModal } from '../features/playlist/components/SongPickerModal';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { usePageTitle } from '../hooks/usePageTitle';
import { copyText, notifySuccess, shareLink } from '../lib/notify';
import { withSource } from '../lib/navigation';
import type { LiteSongDto, MyPlaylistDto } from '../types';

interface Draft {
	title: string;
	description: string;
	songs: LiteSongDto[];
}

function isDraftDirty(draft: Draft | null, playlist: MyPlaylistDto | undefined) {
	if (!draft || !playlist) return false;
	return (
		draft.title !== playlist.title ||
		draft.description !== (playlist.description ?? '') ||
		draft.songs.map((s) => s.id).join(',') !== playlist.songs.map((s) => s.id).join(',')
	);
}

// ---------------------------------------------------------------------------
// View mode
// ---------------------------------------------------------------------------

function SongRows({ songs }: { songs: LiteSongDto[] }) {
	const location = useLocation();
	return (
		<div className="list-surface">
			{songs.map((song, i) => (
				<Link
					key={song.id}
					to={withSource(`/song/${song.id}`, location)}
					className="list-row"
					onPointerEnter={() => void queryClient.prefetchQuery(songQuery(song.id))}
					onTouchStart={() => void queryClient.prefetchQuery(songQuery(song.id))}
				>
					<Text c="dimmed" fw={600} w={24} ta="right" style={{ flexShrink: 0 }}>
						{i + 1}
					</Text>
					<div className="list-row__main">
						<Text fw={600} truncate>
							{song.name}
						</Text>
						{song.artist && (
							<Text size="sm" c="dimmed" truncate>
								{song.artist}
							</Text>
						)}
					</div>
					<KeyBadge value={song.rootNote} />
				</Link>
			))}
		</div>
	);
}

// Drag-and-drop is only needed while editing — load it on demand.
const EditableSongRows = lazy(() => import('../features/playlist/components/EditableSongRows'));

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PlaylistPage() {
	const id = Number(useParams().id);
	const navigate = useNavigate();
	const location = useLocation();
	const { isSignedIn, userId } = useSession();
	const { data: playlist, isPending, error, refetch } = usePlaylist(id);
	const { data: myPlaylists } = useMyPlaylists();
	usePageTitle(playlist?.title);

	const save = useSavePlaylist();
	const remove = useDeletePlaylist();
	const pin = useSetPlaylistPinned();
	const join = useJoinPlaylist();
	const leave = useLeavePlaylist();
	const [pickerOpened, picker] = useDisclosure(false);

	const [draft, setDraft] = useState<Draft | null>(null);
	const editing = draft !== null;
	const dirty = isDraftDirty(draft, playlist);
	useUnsavedChangesGuard(dirty && !save.isPending, 'Your playlist changes are not saved yet.');

	const isOwner = Boolean(playlist && userId && playlist.ownerId === userId);
	const membership = useMemo(() => myPlaylists?.find((p) => p.playlistId === id), [myPlaylists, id]);
	const isMember = isOwner || Boolean(membership);
	const isPinned = membership?.isPinned ?? playlist?.isPinned ?? false;

	const startEditing = () => {
		if (!playlist) return;
		setDraft({ title: playlist.title, description: playlist.description ?? '', songs: playlist.songs });
	};

	// Freshly created playlists open straight in edit mode.
	const wantsEditing = (location.state as { startEditing?: boolean } | null)?.startEditing;
	useEffect(() => {
		if (!wantsEditing || !playlist || !isOwner || editing) return;
		startEditing();
		navigate(location.pathname, { replace: true, state: null });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [wantsEditing, playlist, isOwner]);

	if (isPending) return <ListSkeleton rows={8} />;
	if (error) {
		if (isNotFound(error))
			return <NotFound title="Playlist not found" message="It may have been deleted by its owner." />;
		return <ErrorState error={error} onRetry={() => void refetch()} />;
	}

	const onSave = async () => {
		if (!draft) return;
		if (!draft.title.trim()) return;
		await save.mutateAsync({ playlistId: id, ...draft });
		setDraft(null);
		notifySuccess('Playlist saved');
	};

	const onCancel = async () => {
		if (dirty) {
			const ok = await confirmAction({
				title: 'Discard changes?',
				message: 'Your changes to this playlist will be lost.',
				confirmLabel: 'Discard',
				danger: true,
			});
			if (!ok) return;
		}
		setDraft(null);
	};

	const onDelete = async () => {
		const ok = await confirmAction({
			title: 'Delete playlist?',
			message: `“${playlist.title}” will be deleted for everyone it’s shared with. The songs themselves stay.`,
			confirmLabel: 'Delete',
			danger: true,
		});
		if (!ok) return;
		await remove.mutateAsync(id);
		// Leave edit mode synchronously so the unsaved-changes guard lets us go.
		flushSync(() => setDraft(null));
		notifySuccess('Playlist deleted');
		navigate('/my-playlists', { replace: true });
	};

	const songs = draft?.songs ?? playlist.songs;

	// ----- edit mode ---------------------------------------------------------
	if (editing && draft) {
		const titleMissing = !draft.title.trim();
		return (
			<>
				<PageHeader title="Edit playlist" />
				<Stack gap="md">
					<Card>
						<Stack gap="sm">
							<TextInput
								label="Title"
								required
								value={draft.title}
								error={titleMissing ? 'Give the playlist a title' : null}
								onChange={(e) => {
									const title = e.currentTarget.value;
									setDraft((d) => d && { ...d, title });
								}}
							/>
							<Textarea
								label="Description"
								value={draft.description}
								onChange={(e) => {
									const description = e.currentTarget.value;
									setDraft((d) => d && { ...d, description });
								}}
								autosize
								minRows={2}
							/>
						</Stack>
					</Card>

					<Group justify="space-between">
						<Text fw={700}>
							Songs{' '}
							<Text span c="dimmed" fw={500}>
								({draft.songs.length})
							</Text>
						</Text>
						<Button variant="light" leftSection={<IconPlus size={18} />} onClick={picker.open}>
							Add songs
						</Button>
					</Group>

					{draft.songs.length > 0 ? (
						<Suspense fallback={<ListSkeleton rows={Math.min(draft.songs.length, 8)} />}>
							<EditableSongRows songs={draft.songs} onChange={(next) => setDraft((d) => d && { ...d, songs: next })} />
						</Suspense>
					) : (
						<Card>
							<Text c="dimmed" ta="center" py="md">
								No songs yet. Use “Add songs” to pick from your library.
							</Text>
						</Card>
					)}

					<Button
						variant="subtle"
						color="red"
						leftSection={<IconTrash size={16} />}
						onClick={() => void onDelete()}
						loading={remove.isPending}
						style={{ alignSelf: 'flex-start' }}
					>
						Delete playlist
					</Button>
				</Stack>

				<SongPickerModal
					opened={pickerOpened}
					onClose={picker.close}
					selected={draft.songs}
					onToggle={(song, add) =>
						setDraft((d) => {
							if (!d) return d;
							const without = d.songs.filter((s) => s.id !== song.id);
							return { ...d, songs: add ? [...without, song] : without };
						})
					}
				/>

				<Box className="sticky-bottom-bar" mx={{ base: -16, md: -32 }} px={{ base: 16, md: 32 }} py="sm" mt="lg">
					<Group justify="flex-end" gap="xs">
						<Button
							variant="default"
							leftSection={<IconX size={18} />}
							onClick={() => void onCancel()}
							disabled={save.isPending}
						>
							Cancel
						</Button>
						<Button
							leftSection={<IconCheck size={18} />}
							onClick={() => void onSave()}
							loading={save.isPending}
							disabled={titleMissing}
						>
							Save
						</Button>
					</Group>
				</Box>
			</>
		);
	}

	// ----- view mode ---------------------------------------------------------
	return (
		<>
			<PageHeader
				leading={isSignedIn ? <BackLink fallback="/my-playlists" /> : undefined}
				title={playlist.title}
				subtitle={playlist.description || undefined}
			>
				<Group gap={6}>
					<Badge variant="light" color="gray">
						{songs.length} song{songs.length === 1 ? '' : 's'}
					</Badge>
					{isSignedIn && !isOwner && (
						<Badge variant="light" color="blue">
							Shared playlist
						</Badge>
					)}
				</Group>
				<Group gap="xs" wrap="wrap">
					{songs.length > 0 && (
						<Button component={Link} to="play" leftSection={<IconPlayerPlayFilled size={18} />}>
							Play
						</Button>
					)}
					{isOwner && (
						<Button variant="default" leftSection={<IconPencil size={18} />} onClick={startEditing}>
							Edit
						</Button>
					)}
					{isSignedIn && !isOwner && !membership && (
						<Button
							variant="default"
							leftSection={<IconPlaylistAdd size={18} />}
							onClick={() => join.mutate(id, { onSuccess: () => notifySuccess('Added to your playlists') })}
							loading={join.isPending}
						>
							Add to my playlists
						</Button>
					)}
					{isMember && (
						<Tooltip label={isPinned ? 'Unpin' : 'Pin to the top'}>
							<ActionIcon
								size="lg"
								variant="default"
								onClick={() => pin.mutate({ playlistId: id, pinned: !isPinned })}
								aria-label={isPinned ? 'Unpin playlist' : 'Pin playlist'}
								aria-pressed={isPinned}
							>
								{isPinned ? (
									<IconPinFilled size={18} style={{ color: 'var(--mantine-primary-color-filled)' }} />
								) : (
									<IconPin size={18} />
								)}
							</ActionIcon>
						</Tooltip>
					)}
					<Tooltip label="Share link">
						<ActionIcon
							size="lg"
							variant="default"
							onClick={() => void shareLink(playlist.title)}
							aria-label="Share link"
						>
							<IconShare size={18} />
						</ActionIcon>
					</Tooltip>
					<Menu position="bottom-end" width={230}>
						<Menu.Target>
							<ActionIcon size="lg" variant="default" aria-label="More actions">
								<IconDotsVertical size={18} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								leftSection={<IconCopy size={16} />}
								onClick={() => void copyText(songs.map((s) => s.name).join('\n'), 'Song list copied')}
								disabled={songs.length === 0}
							>
								Copy song list
							</Menu.Item>
							{!isOwner && membership && (
								<Menu.Item
									leftSection={<IconPlaylistX size={16} />}
									onClick={() =>
										leave.mutate(
											{ memberRecordId: membership.memberRecordId, playlistId: id },
											{ onSuccess: () => notifySuccess('Removed from your playlists') },
										)
									}
								>
									Remove from my playlists
								</Menu.Item>
							)}
							{isOwner && (
								<>
									<Menu.Divider />
									<Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => void onDelete()}>
										Delete playlist
									</Menu.Item>
								</>
							)}
						</Menu.Dropdown>
					</Menu>
				</Group>
			</PageHeader>

			{songs.length > 0 ? (
				<SongRows songs={songs} />
			) : (
				<Card>
					<Stack align="center" gap="sm" py="lg">
						<Text c="dimmed">This playlist is empty.</Text>
						{isOwner && (
							<Button
								variant="light"
								leftSection={<IconPlus size={18} />}
								onClick={() => {
									startEditing();
									picker.open();
								}}
							>
								Add songs
							</Button>
						)}
					</Stack>
				</Card>
			)}
		</>
	);
}
