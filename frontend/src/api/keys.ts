/** Query keys. Hierarchical so whole groups can be invalidated at once. */
export const keys = {
	songs: ['songs'] as const,
	mySongs: () => ['songs', 'mine'] as const,
	song: (id: number) => ['songs', 'detail', id] as const,
	forks: (originalId: number) => ['songs', 'forks', originalId] as const,
	cachedSong: (id: number | string) => ['cachedSongs', String(id)] as const,
	starred: () => ['starred'] as const,
	playlists: ['playlists'] as const,
	myPlaylists: () => ['playlists', 'mine'] as const,
	playlist: (id: number) => ['playlists', 'detail', id] as const,
	search: (q: string, start: number) => ['search', q, start] as const,
};
