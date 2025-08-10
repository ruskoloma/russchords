import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { showNotification } from '@mantine/notifications';
import { useMyFetch } from './api';
import { useEffect, useState } from 'react';
import type { SongDto } from '../types';
import { useAuth } from 'react-oidc-context';

export function useMyStarred() {
	const client = useMyFetch();
	const auth = useAuth();

	const key = auth?.isAuthenticated ? '/api/starred/my' : null;

	const { data, error, isLoading, mutate } = useSWR(
		key,
		async (k: string) => {
			const res = await client.get<Array<SongDto>>(k);
			return res.data;
		},
		{ revalidateOnFocus: false },
	);

	return {
		data,
		error,
		isLoading,
		refresh: () => mutate(),
	};
}

export function useStarSongs() {
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'STAR_SONGS',
		async (_: string, { arg: ids }: { arg: number[] }) => {
			await Promise.all(ids.map((id) => client.post(`/api/starred/${id}`)));
		},
		{
			onSuccess: () => mutate('/api/starred/my'),
			onError: (err) => {
				showNotification({ title: 'Star failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		starSongs: (ids: number[]) => trigger(ids),
		isStarring: isMutating,
		error,
	};
}

export function useUnstarSong() {
	const client = useMyFetch();
	const { mutate } = useSWRConfig();

	const { trigger, isMutating, error } = useSWRMutation(
		'UNSTAR_SONG',
		async (_: string, { arg: songId }: { arg: number }) => {
			await client.delete(`/api/starred/${songId}`);
		},
		{
			onSuccess: () => mutate('/api/starred/my'),
			onError: (err) => {
				showNotification({ title: 'Unstar failed', message: String(err), color: 'red' });
			},
		},
	);

	return {
		unstarSong: (songId: number) => trigger(songId),
		isUnstarring: isMutating,
		error,
	};
}

export function useIsStarred() {
	const { data } = useMyStarred();

	const isStarredId = (id: number) => {
		return !!data?.find(({ id: songId }) => songId === id);
	};

	return {
		isStarredId,
		starredItems: data,
	};
}

export function useStarredState(songId: number) {
	const [isStarred, setIsStarred] = useState(false);

	const { starredItems, isStarredId } = useIsStarred();
	const { starSongs, isStarring } = useStarSongs();
	const { unstarSong, isUnstarring } = useUnstarSong();

	useEffect(() => {
		if (!starredItems) return;

		setIsStarred(isStarredId(songId));
	}, [starredItems, songId]);

	const handleStar = async () => {
		await starSongs([songId]);
		setIsStarred(true);
	};

	const handleUnstar = async () => {
		await unstarSong(songId);
		setIsStarred(false);
	};

	return {
		isStarred,
		isLoading: isStarring || isUnstarring,
		starSong: handleStar,
		unstarSong: handleUnstar,
	};
}
