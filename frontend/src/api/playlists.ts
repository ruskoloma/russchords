import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth/useSession';
import type { CreatePlaylistDto, LiteSongDto, MyPlaylistDto, PlaylistDto } from '../types';
import { api, asArray } from './client';
import { keys } from './keys';

export const myPlaylistsQuery = () =>
	queryOptions({
		queryKey: keys.myPlaylists(),
		queryFn: async ({ signal }) =>
			asArray<MyPlaylistDto>((await api.get('/playlist/my', { signal })).data).map((p) => ({
				...p,
				songs: p.songs ?? [],
			})),
	});

export const playlistQuery = (id: number) =>
	queryOptions({
		queryKey: keys.playlist(id),
		queryFn: async ({ signal }) => {
			const { data } = await api.get<MyPlaylistDto>(`/playlist/${id}`, { signal });
			return { ...data, songs: data.songs ?? [] };
		},
	});

export function useMyPlaylists() {
	const { isSignedIn } = useSession();
	return useQuery({ ...myPlaylistsQuery(), enabled: isSignedIn });
}

export function usePlaylist(id: number) {
	return useQuery({ ...playlistQuery(id), enabled: Number.isFinite(id) });
}

function useInvalidatePlaylist() {
	const qc = useQueryClient();
	return (playlistId?: number) =>
		Promise.all([
			qc.invalidateQueries({ queryKey: keys.myPlaylists() }),
			playlistId != null ? qc.invalidateQueries({ queryKey: keys.playlist(playlistId) }) : Promise.resolve(),
		]);
}

export function useCreatePlaylist() {
	const invalidate = useInvalidatePlaylist();
	return useMutation({
		meta: { errorTitle: 'Could not create the playlist' },
		mutationFn: async (dto: CreatePlaylistDto) => (await api.post<PlaylistDto>('/playlist', dto)).data,
		onSuccess: () => invalidate(),
	});
}

export function useDeletePlaylist() {
	const qc = useQueryClient();
	return useMutation({
		meta: { errorTitle: 'Could not delete the playlist' },
		mutationFn: async (playlistId: number) => {
			await api.delete(`/playlist/${playlistId}`);
			return playlistId;
		},
		onSuccess: (playlistId) => {
			qc.setQueryData<MyPlaylistDto[]>(keys.myPlaylists(), (prev) => prev?.filter((p) => p.playlistId !== playlistId));
			qc.removeQueries({ queryKey: keys.playlist(playlistId) });
			void qc.invalidateQueries({ queryKey: keys.myPlaylists() });
		},
	});
}

export interface SavePlaylistInput {
	playlistId: number;
	title: string;
	description: string;
	songs: LiteSongDto[];
}

/**
 * Saves title, description, membership and order of a playlist in one go.
 *
 * The diff is computed against a fresh copy from the server — not against
 * whatever the page loaded earlier — so repeated edits (or edits made from
 * another device meanwhile) can never add/remove the wrong songs.
 */
export function useSavePlaylist() {
	const qc = useQueryClient();
	const invalidate = useInvalidatePlaylist();
	return useMutation({
		meta: { errorTitle: 'Could not save the playlist' },
		mutationFn: async ({ playlistId, title, description, songs }: SavePlaylistInput) => {
			const { data: server } = await api.get<MyPlaylistDto>(`/playlist/${playlistId}`);
			const serverIds = new Set(server.songs.map((s) => s.id));
			const nextIds = new Set(songs.map((s) => s.id));

			const toAdd = songs.filter((s) => !serverIds.has(s.id)).map((s) => s.id);
			const toRemove = server.songs.filter((s) => !nextIds.has(s.id)).map((s) => s.id);

			await Promise.all([
				...toAdd.map((id) => api.post(`/playlist/${playlistId}/songs/${id}`)),
				...toRemove.map((id) => api.delete(`/playlist/${playlistId}/songs/${id}`)),
			]);
			await Promise.all([
				api.put(`/playlist/${playlistId}`, { title: title.trim(), description: description.trim() }),
				api.post(`/playlist/${playlistId}/reorder`, { songIds: songs.map((s) => s.id) }),
			]);

			return { server, title: title.trim(), description: description.trim(), songs };
		},
		onSuccess: ({ server, title, description, songs }) => {
			qc.setQueryData<MyPlaylistDto>(keys.playlist(server.playlistId), (prev) => ({
				...(prev ?? server),
				title,
				description,
				songs: songs.map((s, i) => ({ ...s, order: i + 1 })),
			}));
			void invalidate(server.playlistId);
		},
	});
}

/** Adds songs to the end of a playlist (bulk "Add to playlist"). */
export function useAddSongsToPlaylist() {
	const invalidate = useInvalidatePlaylist();
	return useMutation({
		meta: { errorTitle: 'Could not add to the playlist' },
		mutationFn: async ({ playlistId, songIds }: { playlistId: number; songIds: number[] }) => {
			for (const id of songIds) await api.post(`/playlist/${playlistId}/songs/${id}`);
			return playlistId;
		},
		onSuccess: (playlistId) => invalidate(playlistId),
	});
}

/** Toggles one song in one playlist, optimistically updating "my playlists". */
export function useTogglePlaylistSong() {
	const qc = useQueryClient();
	const invalidate = useInvalidatePlaylist();
	return useMutation({
		meta: { errorTitle: 'Could not update the playlist' },
		mutationFn: async ({ playlistId, song, add }: { playlistId: number; song: LiteSongDto; add: boolean }) => {
			if (add) await api.post(`/playlist/${playlistId}/songs/${song.id}`);
			else await api.delete(`/playlist/${playlistId}/songs/${song.id}`);
		},
		onMutate: async ({ playlistId, song, add }) => {
			await qc.cancelQueries({ queryKey: keys.myPlaylists() });
			const previous = qc.getQueryData<MyPlaylistDto[]>(keys.myPlaylists());
			qc.setQueryData<MyPlaylistDto[]>(keys.myPlaylists(), (prev) =>
				prev?.map((p) => {
					if (p.playlistId !== playlistId) return p;
					const without = p.songs.filter((s) => s.id !== song.id);
					return { ...p, songs: add ? [...without, song] : without };
				}),
			);
			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) qc.setQueryData(keys.myPlaylists(), context.previous);
		},
		onSettled: (_data, _err, { playlistId }) => invalidate(playlistId),
	});
}

export function useSetPlaylistPinned() {
	const qc = useQueryClient();
	return useMutation({
		meta: { errorTitle: 'Could not pin the playlist' },
		mutationFn: async ({ playlistId, pinned }: { playlistId: number; pinned: boolean }) => {
			await api.put(`/playlist/${playlistId}/members/pin`, undefined, { params: { value: pinned } });
		},
		onMutate: async ({ playlistId, pinned }) => {
			await qc.cancelQueries({ queryKey: keys.playlists });
			const prevList = qc.getQueryData<MyPlaylistDto[]>(keys.myPlaylists());
			const prevDetail = qc.getQueryData<MyPlaylistDto>(keys.playlist(playlistId));
			qc.setQueryData<MyPlaylistDto[]>(keys.myPlaylists(), (prev) =>
				prev?.map((p) => (p.playlistId === playlistId ? { ...p, isPinned: pinned } : p)),
			);
			qc.setQueryData<MyPlaylistDto>(keys.playlist(playlistId), (prev) =>
				prev ? { ...prev, isPinned: pinned } : prev,
			);
			return { prevList, prevDetail };
		},
		onError: (_err, { playlistId }, context) => {
			if (context?.prevList) qc.setQueryData(keys.myPlaylists(), context.prevList);
			if (context?.prevDetail) qc.setQueryData(keys.playlist(playlistId), context.prevDetail);
		},
		onSettled: (_data, _err, { playlistId }) =>
			Promise.all([
				qc.invalidateQueries({ queryKey: keys.myPlaylists() }),
				qc.invalidateQueries({ queryKey: keys.playlist(playlistId) }),
			]),
	});
}

/** Adds someone else's playlist to "my playlists". */
export function useJoinPlaylist() {
	const { userId } = useSession();
	const invalidate = useInvalidatePlaylist();
	return useMutation({
		meta: { errorTitle: 'Could not add the playlist' },
		mutationFn: async (playlistId: number) => {
			if (!userId) throw new Error('Please sign in first');
			await api.post('/playlist/members', { playlistId, memberId: userId });
			return playlistId;
		},
		onSuccess: (playlistId) => invalidate(playlistId),
	});
}

export function useLeavePlaylist() {
	const invalidate = useInvalidatePlaylist();
	return useMutation({
		meta: { errorTitle: 'Could not remove the playlist' },
		mutationFn: async ({ memberRecordId, playlistId }: { memberRecordId: number; playlistId: number }) => {
			await api.delete(`/playlist/members/${memberRecordId}`);
			return playlistId;
		},
		onSuccess: (playlistId) => invalidate(playlistId),
	});
}
