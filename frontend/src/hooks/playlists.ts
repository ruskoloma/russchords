import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { showNotification } from '@mantine/notifications';
import { useMyFetch } from './api';
import type { CreatePlaylistDto, PlaylistDto, PlaylistSummary, PlaylistWithSongs } from '../types';

// Общий fetcher для SWR
const fetcher = async <T>(url: string) => {
	const client = await useMyFetch();
	const res = await client.get<T>(url);
	return res.data;
};

export function useMyPlaylists() {
	const { data, error, isLoading, mutate } = useSWR<PlaylistSummary[]>('/api/playlist', fetcher, {
		revalidateOnFocus: false,
	});
	return { playlists: data ?? [], error, isLoading, refresh: () => mutate() };
}

export function usePlaylist(id: number | null | undefined) {
	const key = id ? `/api/playlist/${id}` : null;
	const { data, error, isLoading, mutate } = useSWR<PlaylistWithSongs>(key, fetcher, { revalidateOnFocus: false });
	return { playlist: data ?? null, error, isLoading, refresh: () => mutate() };
}

export function useCreatePlaylist() {
	const { mutate } = useSWRConfig();
	const { trigger, isMutating, error } = useSWRMutation(
		'CREATE_PLAYLIST',
		async (_: string, { arg }: { arg: CreatePlaylistDto }) => {
			const client = await useMyFetch();
			const res = await client.post<PlaylistDto>('/api/playlist', arg);
			return res.data;
		},
		{
			onSuccess: async () => {
				showNotification({ title: 'Playlist created', message: 'Successfully created.', color: 'green' });
				await mutate('/api/playlist');
			},
			onError: (err) => showNotification({ title: 'Create failed', message: String(err), color: 'red' }),
		},
	);
	return {
		createPlaylist: (dto: CreatePlaylistDto) => trigger(dto),
		isCreating: isMutating,
		error,
	};
}

export function useUpdatePlaylist() {
	const { mutate } = useSWRConfig();
	const { trigger, isMutating, error } = useSWRMutation(
		'UPDATE_PLAYLIST',
		async (_: string, { arg }: { arg: { id: number; dto: Partial<PlaylistDto> } }) => {
			const client = await useMyFetch();
			await client.put(`/api/playlist/${arg.id}`, arg.dto);
			return arg.id;
		},
		{
			onSuccess: async (id) => {
				showNotification({ title: 'Playlist updated', message: 'Changes saved.', color: 'green' });
				await mutate('/api/playlist');
				await mutate(`/api/playlist/${id}`);
			},
			onError: (err) => showNotification({ title: 'Update failed', message: String(err), color: 'red' }),
		},
	);
	return {
		updatePlaylist: (id: number, dto: Partial<PlaylistDto>) => trigger({ id, dto }),
		isUpdating: isMutating,
		error,
	};
}

export function useDeletePlaylist() {
	const { mutate } = useSWRConfig();
	const { trigger, isMutating, error } = useSWRMutation(
		'DELETE_PLAYLIST',
		async (_: string, { arg: id }: { arg: number }) => {
			const client = await useMyFetch();
			await client.delete(`/api/playlist/${id}`);
			return id;
		},
		{
			onSuccess: async () => {
				showNotification({ title: 'Playlist deleted', message: 'Removed successfully.', color: 'green' });
				await mutate('/api/playlist');
			},
			onError: (err) => showNotification({ title: 'Delete failed', message: String(err), color: 'red' }),
		},
	);
	return {
		deletePlaylist: (id: number) => trigger(id),
		isDeleting: isMutating,
		error,
	};
}

export function useAddSongToPlaylist() {
	const { mutate } = useSWRConfig();
	const { trigger, isMutating, error } = useSWRMutation(
		'ADD_SONG_TO_PLAYLIST',
		async (_: string, { arg }: { arg: { playlistId: number; songId: number } }) => {
			const client = await useMyFetch();
			await client.post(`/api/playlist/${arg.playlistId}/songs/${arg.songId}`);
			return arg.playlistId;
		},
		{
			onSuccess: async (playlistId) => {
				showNotification({ title: 'Added', message: 'Song added to playlist.', color: 'green' });
				await mutate(`/api/playlist/${playlistId}`);
			},
			onError: (err) => showNotification({ title: 'Add failed', message: String(err), color: 'red' }),
		},
	);
	return {
		addSongToPlaylist: (playlistId: number, songId: number) => trigger({ playlistId, songId }),
		isAdding: isMutating,
		error,
	};
}

export function useRemoveSongFromPlaylist() {
	const { mutate } = useSWRConfig();
	const { trigger, isMutating, error } = useSWRMutation(
		'REMOVE_SONG_FROM_PLAYLIST',
		async (_: string, { arg }: { arg: { playlistId: number; songId: number } }) => {
			const client = await useMyFetch();
			await client.delete(`/api/playlist/${arg.playlistId}/songs/${arg.songId}`);
			return arg.playlistId;
		},
		{
			onSuccess: async (playlistId) => {
				showNotification({ title: 'Removed', message: 'Song removed from playlist.', color: 'green' });
				await mutate(`/api/playlist/${playlistId}`);
			},
			onError: (err) => showNotification({ title: 'Remove failed', message: String(err), color: 'red' }),
		},
	);
	return {
		removeSongFromPlaylist: (playlistId: number, songId: number) => trigger({ playlistId, songId }),
		isRemoving: isMutating,
		error,
	};
}
