import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth/useSession';
import type { SongDto } from '../types';
import { api, asArray } from './client';
import { keys } from './keys';

export const starredQuery = () =>
	queryOptions({
		queryKey: keys.starred(),
		queryFn: async ({ signal }) => asArray<SongDto>((await api.get('/starred/my', { signal })).data),
	});

export function useStarred() {
	const { isSignedIn } = useSession();
	return useQuery({ ...starredQuery(), enabled: isSignedIn });
}

export function useIsStarred(songId: number) {
	const { data } = useStarred();
	return Boolean(data?.some((s) => s.id === songId));
}

type StarSong = Pick<SongDto, 'id' | 'name'> & Partial<SongDto>;

/** Star / unstar with an optimistic update of the starred list. */
export function useToggleStar() {
	const qc = useQueryClient();
	return useMutation({
		meta: { errorTitle: 'Could not update starred songs' },
		mutationFn: async ({ song, starred }: { song: StarSong; starred: boolean }) => {
			if (starred) await api.post(`/starred/${song.id}`);
			else await api.delete(`/starred/${song.id}`);
		},
		onMutate: async ({ song, starred }) => {
			await qc.cancelQueries({ queryKey: keys.starred() });
			const previous = qc.getQueryData<SongDto[]>(keys.starred());
			qc.setQueryData<SongDto[]>(keys.starred(), (prev = []) => {
				const without = prev.filter((s) => s.id !== song.id);
				return starred ? [...without, song as SongDto] : without;
			});
			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) qc.setQueryData(keys.starred(), context.previous);
		},
		onSettled: () => qc.invalidateQueries({ queryKey: keys.starred() }),
	});
}
