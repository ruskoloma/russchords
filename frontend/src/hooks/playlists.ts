import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { showNotification } from '@mantine/notifications';
import { useMyFetch } from './api';
import type { CreatePlaylistDto, MyPlaylistDto, PlaylistDto, UpdatePlaylistDto } from '../types';
import { useAuth } from 'react-oidc-context';

export function useMyPlaylistsWithDetails(enabled: boolean = true) {
	const client = useMyFetch();
	const fetcher = (url: string) => client.get<MyPlaylistDto[]>(url).then((r) => r.data);
	const key = enabled ? '/playlist/my' : null;
	const { data, error, isLoading, mutate } = useSWR<MyPlaylistDto[]>(key, fetcher, {
		revalidateOnFocus: false,
	});
	return { playlists: data ?? [], error, isLoading, refresh: () => mutate() };
}

export function usePlaylistFull(id: number | null | undefined) {
	const client = useMyFetch();
	const key = id ? `/api/playlist/${id}` : null;
	const fetcher = (url: string) => client.get<MyPlaylistDto>(url).then((r) => r.data);

	const { data, error, isLoading, mutate } = useSWR<MyPlaylistDto>(key, fetcher, {
		revalidateOnFocus: false,
	});

	return { playlist: data ?? null, error, isLoading, refresh: () => mutate() };
}

export function useCreatePlaylist(opts: { onSuccess?: (created: PlaylistDto) => void } = {}) {
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'CREATE_PLAYLIST',
		async (_: string, { arg }: { arg: CreatePlaylistDto }) => {
			const res = await client.post<PlaylistDto>('/playlist', arg);
			return res.data;
		},
		{
			onSuccess: async (created) => {
				showNotification({ title: 'Playlist created', message: 'Successfully created.', color: 'green' });
				await mutate('/playlist/my');
				opts.onSuccess?.(created);
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
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'UPDATE_PLAYLIST',
		async (_: string, { arg }: { arg: { id: number; dto: UpdatePlaylistDto } }) => {
			await client.put(`/api/playlist/${arg.id}`, arg.dto);
			return arg.id;
		},
		{
			onSuccess: async (id) => {
				showNotification({ title: 'Playlist updated', message: 'Changes saved.', color: 'green' });
				await mutate('/playlist/my');
				await mutate(`/api/playlist/${id}`);
			},
			onError: (err) => showNotification({ title: 'Update failed', message: String(err), color: 'red' }),
		},
	);

	return {
		updatePlaylist: (id: number, dto: UpdatePlaylistDto) => trigger({ id, dto }),
		isUpdating: isMutating,
		error,
	};
}

export function useDeletePlaylist() {
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'DELETE_PLAYLIST',
		async (_: string, { arg: id }: { arg: number }) => {
			await client.delete(`/api/playlist/${id}`);
			return id;
		},
		{
			onSuccess: async () => {
				showNotification({ title: 'Playlist deleted', message: 'Removed successfully.', color: 'green' });
				await mutate('/playlist/my');
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
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'ADD_SONG_TO_PLAYLIST',
		async (_: string, { arg }: { arg: { playlistId: number; songId: number } }) => {
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
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'REMOVE_SONG_FROM_PLAYLIST',
		async (_: string, { arg }: { arg: { playlistId: number; songId: number } }) => {
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

export function useSetPlaylistPinned() {
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'SET_PLAYLIST_PINNED',
		async (_: string, { arg }: { arg: { playlistId: number; value: boolean } }) => {
			await client.put(`/api/playlist/${arg.playlistId}/members/pin?value=${arg.value}`);
			return arg.playlistId;
		},
		{
			onSuccess: async (playlistId) => {
				await mutate('/playlist/my');
				await mutate(`/api/playlist/${playlistId}`);
			},
			onError: (err) => showNotification({ title: 'Pin failed', message: String(err), color: 'red' }),
		},
	);

	return {
		setPinned: (playlistId: number, value: boolean) => trigger({ playlistId, value }),
		isSetting: isMutating,
		error,
	};
}

export function useSavePlaylistOrder() {
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'SAVE_PLAYLIST_ORDER',
		async (_: string, { arg }: { arg: { playlistId: number; songIds: number[] } }) => {
			await client.post(`/api/playlist/${arg.playlistId}/reorder`, { songIds: arg.songIds });
			return arg.playlistId;
		},
		{
			onSuccess: async (playlistId) => {
				showNotification({ title: 'Order saved', message: 'Song order updated.', color: 'green' });
				await mutate(`/api/playlist/${playlistId}`);
			},
			onError: (err) => showNotification({ title: 'Save order failed', message: String(err), color: 'red' }),
		},
	);

	return {
		saveOrder: (playlistId: number, songIds: number[]) => trigger({ playlistId, songIds }),
		isSaving: isMutating,
		error,
	};
}

export function useAddPlaylistToMy() {
	const client = useMyFetch();
	const { mutate } = useSWRConfig();
	const auth = useAuth();

	const { trigger, isMutating, error } = useSWRMutation(
		'ADD_PLAYLIST_TO_MY',
		async (_: string, { arg: playlistId }: { arg: number }) => {
			const me = auth.user?.profile?.sub;

			if (!me) {
				throw new Error('Not authorized');
			}
			await client.post('/playlist/members', { playlistId, memberId: me });
			return playlistId;
		},
		{
			onSuccess: async () => {
				showNotification({ title: 'Added', message: 'Playlist added to your list.', color: 'green' });
				await mutate('/playlist/my');
			},
			onError: (err) => {
				showNotification({ title: 'Add failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		addToMy: (playlistId: number) => trigger(playlistId),
		isAdding: isMutating,
		error,
	};
}

export function useRemovePlaylistFromMy() {
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'REMOVE_PLAYLIST_FROM_MY',
		async (_: string, { arg: membershipId }: { arg: number }) => {
			await client.delete(`/api/playlist/members/${membershipId}`);
			return membershipId;
		},
		{
			onSuccess: async () => {
				showNotification({ title: 'Removed', message: 'Playlist removed from your list.', color: 'green' });
				await mutate('/playlist/my');
			},
			onError: (err) => {
				showNotification({ title: 'Remove failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		removeFromMy: (membershipId: number) => trigger(membershipId),
		isRemovingFromMy: isMutating,
		error,
	};
}

export function useIsPlaylistOwner(ownerId?: string) {
	const auth = useAuth();
	const me = auth.user?.profile?.sub;
	return Boolean(ownerId && me && ownerId === me);
}
