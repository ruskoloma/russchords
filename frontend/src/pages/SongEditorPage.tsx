import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useCreateSong, useIsSongOwner, useMySongs, useSong, useUpdateSong } from '../api/songs';
import { isNotFound } from '../api/client';
import { useSession } from '../auth/useSession';
import { BackLink } from '../components/BackLink';
import { PageHeader } from '../components/PageHeader';
import { SongSkeleton } from '../components/ListSkeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { NotFound } from '../components/NotFound';
import { SignInRequired } from '../components/SignInRequired';
import { SongEditor, type SongFormValues } from '../features/song/components/SongEditor';
import { usePageTitle } from '../hooks/usePageTitle';
import { useGoBack } from '../hooks/useGoBack';
import { notifySuccess } from '../lib/notify';
import type { SongDto } from '../types';

const EMPTY: SongFormValues = { name: '', artist: '', content: '', rootNote: null, notes: '', tags: [] };

function useTagSuggestions() {
	const { data } = useMySongs();
	return useMemo(() => {
		const seen = new Map<string, string>();
		for (const s of data ?? [])
			for (const t of s.tags ?? []) if (!seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
		return [...seen.values()].sort((a, b) => a.localeCompare(b));
	}, [data]);
}

const draftKeyFor = (userId: string | null, songId: number | 'new') => `russchords:draft:${userId ?? 'anon'}:${songId}`;

export function CreateSongPage() {
	usePageTitle('New song');
	const navigate = useNavigate();
	const { isSignedIn, userId, isLoading } = useSession();
	const create = useCreateSong();
	const tags = useTagSuggestions();
	const goBack = useGoBack('/my-songs');

	if (!isSignedIn) return <SignInRequired description="Sign in to write and save your own songs." />;
	// Wait for the user id so the draft key is stable.
	if (isLoading) return <SongSkeleton />;

	return (
		<>
			<PageHeader leading={<BackLink fallback="/my-songs" />} title="New song" />
			<SongEditor
				initial={EMPTY}
				draftKey={draftKeyFor(userId, 'new')}
				tagSuggestions={tags}
				submitLabel="Create song"
				onCancel={goBack}
				onSubmit={async (v) => {
					const created = await create.mutateAsync({
						name: v.name,
						artist: v.artist || null,
						content: v.content,
						rootNote: v.rootNote,
						description: v.notes || null,
						tags: v.tags,
					});
					notifySuccess('Song created');
					navigate(`/song/${created.id}`, { replace: true });
				}}
			/>
		</>
	);
}

function toForm(song: SongDto): SongFormValues {
	return {
		name: song.name ?? '',
		artist: song.artist ?? '',
		content: song.content ?? '',
		rootNote: song.rootNote ?? null,
		notes: song.description ?? '',
		tags: song.tags ?? [],
	};
}

export function EditSongPage() {
	const id = Number(useParams().id);
	const navigate = useNavigate();
	const { isSignedIn, userId, isLoading } = useSession();
	const { data: song, isPending, error, refetch } = useSong(id);
	const isOwner = useIsSongOwner(song);
	const update = useUpdateSong();
	const tags = useTagSuggestions();
	const goBack = useGoBack(`/song/${id}`);
	usePageTitle(song ? `Edit · ${song.name}` : 'Edit song');

	// Snapshot of the song when editing started; background refetches must
	// not reset what the user is typing.
	const initial = useMemo(() => (song ? toForm(song) : null), [song?.id]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!isSignedIn) return <SignInRequired />;
	if (isPending || isLoading) return <SongSkeleton />;
	if (error) {
		if (isNotFound(error)) return <NotFound title="Song not found" />;
		return <ErrorState error={error} onRetry={() => void refetch()} />;
	}
	if (!isOwner) {
		return (
			<EmptyState
				icon={<IconLock size={28} />}
				title="You can’t edit this song"
				description="It belongs to someone else. Make a copy in your songs and edit that instead."
				action={
					<Button variant="light" onClick={() => navigate(`/song/${id}`)}>
						Back to the song
					</Button>
				}
			/>
		);
	}

	return (
		<>
			<PageHeader leading={<BackLink fallback={`/song/${id}`} />} title="Edit song" subtitle={song.name} />
			<SongEditor
				initial={initial ?? toForm(song)}
				draftKey={draftKeyFor(userId, id)}
				tagSuggestions={tags}
				submitLabel="Save"
				onCancel={goBack}
				onSubmit={async (v) => {
					await update.mutateAsync({
						id,
						dto: {
							name: v.name,
							artist: v.artist || null,
							content: v.content,
							rootNote: v.rootNote,
							description: v.notes || null,
							tags: v.tags,
						},
					});
					notifySuccess('Saved');
					goBack();
				}}
			/>
		</>
	);
}
