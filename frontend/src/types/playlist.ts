export interface PlaylistDto {
	id: number;
	ownerId: string;
	title: string;
	description?: string | null;
}

export interface LiteSongDto {
	id: number;
	name: string;
	artist?: string | null;
	sourceUrl?: string | null;
	rootNote?: string | null;
	order?: number | null;
}

export interface MyPlaylistDto {
	playlistId: number;
	ownerId: string;
	title: string;
	description?: string | null;
	isPinned: boolean;
	songs: LiteSongDto[];
	memberRecordId: number;
}

export interface CreatePlaylistDto {
	title: string;
	description?: string | null;
}

export interface UpdatePlaylistDto {
	title?: string | null;
	description?: string | null;
}
