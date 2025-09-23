import useSWRMutation from 'swr/mutation';
import useSWR from 'swr';
import type { CreateSongDto, LiteSongDto, UpdateSongDto } from '../types';
import { showNotification } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useMyFetch } from './api';
import { useAuth } from 'react-oidc-context';

export function useDeleteSongs(params: { navigateOnSuccess?: boolean } = { navigateOnSuccess: false }) {
	const { navigateOnSuccess } = params;

	const navigate = useNavigate();
	const client = useMyFetch();

	const { data, trigger, isMutating, error } = useSWRMutation(
		'DELETE_SONGS',
		async (_: string, { arg: ids }: { arg: number[] }) => {
			await Promise.all(ids.map((id) => client.delete(`/api/song/${id}`)));
			return ids;
		},
		{
			onError: (err) => {
				showNotification({ title: 'Delete failed', message: String(err), color: 'red' });
			},
			onSuccess: () => {
				showNotification({
					title: 'Song deleted',
					message: 'The song was removed successfully.',
					color: 'green',
				});

				if (navigateOnSuccess) navigate(`/my-songs`);
			},
		},
	);

	return {
		deleteSongs: (ids: number[]) => trigger(ids),
		isDeleting: isMutating,
		deletedIds: data ?? [],
		error,
	};
}

export function useAddSongsToPlaylist() {
	const client = useMyFetch();

	type Arg = { playlistId: string; songIds: number[] };

	const { trigger, isMutating, error } = useSWRMutation(
		'ADD_SONGS_TO_PLAYLIST',
		async (_: string, { arg }: { arg: Arg }) => {
			await client.post(`/api/playlists/${arg.playlistId}/songs`, { songIds: arg.songIds });
		},
		{
			onError: (err) => {
				showNotification({ title: 'Add to playlist failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		addToPlaylist: (playlistId: string, songIds: number[]) => trigger({ playlistId, songIds }),
		isAdding: isMutating,
		error,
	};
}

export function useForkSong(params: { navigateOnSuccess?: boolean } = { navigateOnSuccess: false }) {
	const { navigateOnSuccess } = params;

	const client = useMyFetch();
	const navigate = useNavigate();

	const { trigger, isMutating, error } = useSWRMutation(
		'FORK_SONG',
		async (_: string, { arg: songId }: { arg: string }) => {
			const res = await client.post<{ id: number }>(`/api/song/fork/${songId}`);
			return res.data.id;
		},
		{
			onSuccess: (newId) => {
				if (navigateOnSuccess) navigate(`/song/${newId}`);
			},
			onError: (err) => {
				showNotification({ title: 'Fork failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		forkSong: (songId: string) => trigger(songId),
		isForking: isMutating,
		error,
	};
}

export function useCloneSong(params: { navigateOnSuccess?: boolean } = { navigateOnSuccess: false }) {
	const { navigateOnSuccess } = params;

	const client = useMyFetch();
	const navigate = useNavigate();

	const { trigger, isMutating, error } = useSWRMutation(
		'CLONE_SONG',
		async (_: string, { arg: songId }: { arg: number }) => {
			const res = await client.post<{ id: number }>(`/api/song/clone/${songId}`);
			return res.data.id;
		},
		{
			onSuccess: (newId) => {
				showNotification({
					title: 'Clone successful',
					message: 'The song has been cloned successfully.',
					color: 'green',
				});

				if (navigateOnSuccess) navigate(`/song/${newId}`);
			},
			onError: (err) => {
				showNotification({ title: 'Clone failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		cloneSong: (songId: number) => trigger(songId),
		isCloning: isMutating,
		error,
	};
}

export function useIsSongOwner(ownerId?: string) {
	const auth = useAuth();
	const me = auth.user?.profile?.sub;
	return Boolean(ownerId && me && ownerId === me);
}

export function useMyLightSongs(enabled: boolean = true) {
	const client = useMyFetch();
	const key = enabled ? '/song/my/light' : null;

	const { data, error, isLoading, mutate } = useSWR(
		key,
		async (k: string) => {
			const res = await client.get<LiteSongDto[]>(k);
			return res.data;
		},
		{ revalidateOnFocus: false },
	);

	return {
		songs: data ?? [],
		error,
		isLoading,
		refresh: () => mutate(),
	};
}

export function useMyForksByOriginalId(originalId?: number | string, enabled: boolean = true) {
	const client = useMyFetch();
	const key = enabled && originalId != null ? `/api/song/my/forks/${originalId}` : null;

	const { data, error, isLoading, mutate } = useSWR(
		key,
		async (k: string) => {
			const res = await client.get<LiteSongDto[]>(k);
			return res.data;
		},
		{ revalidateOnFocus: false },
	);

	return {
		forks: data ?? [],
		error,
		isLoading,
		refresh: () => mutate(),
	};
}

export function useUpdateSong(opts: { onSuccess?: (id: number) => void } = {}) {
	const client = useMyFetch();

	const { trigger, isMutating, error } = useSWRMutation(
		'UPDATE_SONG',
		async (_: string, { arg }: { arg: { id: number; dto: UpdateSongDto } }) => {
			await client.put(`/api/song/${arg.id}`, arg.dto);
			return arg.id;
		},
		{
			onSuccess: (id) => {
				showNotification({ title: 'Saved', message: 'Song updated successfully.', color: 'green' });
				opts.onSuccess?.(id);
			},
			onError: (err) => {
				showNotification({ title: 'Update failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		updateSong: (id: number, dto: UpdateSongDto) => trigger({ id, dto }),
		isUpdating: isMutating,
		error,
	};
}

export function useCreateSong(opts: { onSuccess?: (id: number) => void } = {}) {
	const client = useMyFetch();

	const { trigger, isMutating, error } = useSWRMutation(
		'CREATE_SONG',
		async (_: string, { arg }: { arg: CreateSongDto }) => {
			const res = await client.post<{ id: number }>(`/api/song`, arg);
			return res.data.id;
		},
		{
			onSuccess: (id) => {
				showNotification({ title: 'Created', message: 'Song created successfully.', color: 'green' });
				opts.onSuccess?.(id);
			},
			onError: (err) => {
				showNotification({ title: 'Create failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		createSong: (dto: CreateSongDto) => trigger(dto),
		isCreating: isMutating,
		error,
	};
}
