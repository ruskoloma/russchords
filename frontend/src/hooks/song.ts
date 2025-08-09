import useSWRMutation from 'swr/mutation';
import { showNotification } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useMyFetch } from './api';

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
			const res = await client.post<{ id: number }>(`/api/song/fork/cached/${songId}`);
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
			const res = await client.post<{ id: number }>(`/api/song/fork/song/${songId}`);
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
