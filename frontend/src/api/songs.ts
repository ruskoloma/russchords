import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth/useSession';
import type { CreateSongDto, LiteSongDto, SongDto, UpdateSongDto } from '../types';
import { api, asArray } from './client';
import { keys } from './keys';

export const songQuery = (id: number) =>
	queryOptions({
		queryKey: keys.song(id),
		queryFn: async ({ signal }) => (await api.get<SongDto>(`/song/${id}`, { signal })).data,
	});

export const mySongsQuery = () =>
	queryOptions({
		queryKey: keys.mySongs(),
		queryFn: async ({ signal }) => asArray<LiteSongDto>((await api.get('/song/my/light', { signal })).data),
	});

export const forksQuery = (originalId: number) =>
	queryOptions({
		queryKey: keys.forks(originalId),
		queryFn: async ({ signal }) =>
			asArray<LiteSongDto>((await api.get(`/song/my/forks/${originalId}`, { signal })).data),
	});

export function useSong(id: number) {
	return useQuery({ ...songQuery(id), enabled: Number.isFinite(id) });
}

export function useMySongs() {
	const { isSignedIn } = useSession();
	return useQuery({ ...mySongsQuery(), enabled: isSignedIn });
}

export function useMyForks(originalId: number) {
	const { isSignedIn } = useSession();
	return useQuery({ ...forksQuery(originalId), enabled: isSignedIn && Number.isFinite(originalId) });
}

export function useIsSongOwner(song: Pick<SongDto, 'authorId'> | undefined) {
	const { userId } = useSession();
	return Boolean(song && userId && song.authorId === userId);
}

function toLite(song: SongDto): LiteSongDto {
	return {
		id: song.id,
		name: song.name,
		artist: song.artist ?? null,
		sourceUrl: song.sourceUrl ?? null,
		rootNote: song.rootNote ?? null,
		tags: song.tags ?? [],
	};
}

/** After any song write: refresh every list that may show song metadata. */
function useInvalidateSongLists() {
	const qc = useQueryClient();
	return () =>
		Promise.all([
			qc.invalidateQueries({ queryKey: keys.mySongs() }),
			qc.invalidateQueries({ queryKey: keys.starred() }),
			qc.invalidateQueries({ queryKey: keys.playlists }),
		]);
}

export function useCreateSong() {
	const qc = useQueryClient();
	const invalidateLists = useInvalidateSongLists();
	return useMutation({
		meta: { errorTitle: 'Could not create the song' },
		mutationFn: async (dto: CreateSongDto) => (await api.post<SongDto>('/song', dto)).data,
		onSuccess: (created) => {
			qc.setQueryData(keys.song(created.id), created);
			qc.setQueryData<LiteSongDto[]>(keys.mySongs(), (prev) => (prev ? [toLite(created), ...prev] : prev));
			void invalidateLists();
		},
	});
}

export function useUpdateSong() {
	const qc = useQueryClient();
	const invalidateLists = useInvalidateSongLists();
	return useMutation({
		meta: { errorTitle: 'Could not save the song' },
		mutationFn: async ({ id, dto }: { id: number; dto: UpdateSongDto }) => {
			await api.put(`/song/${id}`, dto);
			return { id, dto };
		},
		onSuccess: ({ id, dto }) => {
			// Show the saved version immediately, then confirm with the server.
			qc.setQueryData<SongDto>(keys.song(id), (prev) =>
				prev
					? {
							...prev,
							name: dto.name ?? prev.name,
							content: dto.content ?? prev.content,
							artist: dto.artist ?? undefined,
							description: dto.description ?? null,
							rootNote: dto.rootNote ?? undefined,
							tags: dto.tags ?? prev.tags,
						}
					: prev,
			);
			void qc.invalidateQueries({ queryKey: keys.song(id) });
			void invalidateLists();
		},
	});
}

export function useDeleteSongs() {
	const qc = useQueryClient();
	const invalidateLists = useInvalidateSongLists();
	return useMutation({
		meta: { errorTitle: 'Could not delete' },
		mutationFn: async (ids: number[]) => {
			const results = await Promise.allSettled(ids.map((id) => api.delete(`/song/${id}`)));
			const deleted = ids.filter((_, i) => results[i].status === 'fulfilled');
			const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
			if (deleted.length === 0 && failed) throw failed.reason;
			return { deleted, failedCount: ids.length - deleted.length };
		},
		onSuccess: ({ deleted }) => {
			const gone = new Set(deleted);
			qc.setQueryData<LiteSongDto[]>(keys.mySongs(), (prev) => prev?.filter((s) => !gone.has(s.id)));
			deleted.forEach((id) => qc.removeQueries({ queryKey: keys.song(id) }));
			void invalidateLists();
		},
	});
}

export function useCloneSong() {
	const qc = useQueryClient();
	const invalidateLists = useInvalidateSongLists();
	return useMutation({
		meta: { errorTitle: 'Could not copy the song' },
		mutationFn: async (songId: number) => (await api.post<SongDto>(`/song/clone/${songId}`)).data,
		onSuccess: (created) => {
			qc.setQueryData(keys.song(created.id), created);
			void invalidateLists();
		},
	});
}

export function useForkCachedSong() {
	const qc = useQueryClient();
	const invalidateLists = useInvalidateSongLists();
	return useMutation({
		meta: { errorTitle: 'Could not save the song' },
		mutationFn: async (cachedSongId: number | string) => (await api.post<SongDto>(`/song/fork/${cachedSongId}`)).data,
		onSuccess: (created) => {
			qc.setQueryData(keys.song(created.id), created);
			void qc.invalidateQueries({ queryKey: ['songs', 'forks'] });
			void invalidateLists();
		},
	});
}
