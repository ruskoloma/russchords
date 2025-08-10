import type { SongDto } from './song.ts';

export interface PlaylistDto {
	id: number;
	ownerId: string;
	title: string;
	description?: string | null;
}

export interface LiteSong {
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
	songs: LiteSong[];
}

export interface CreatePlaylistDto {
	title: string;
	description?: string | null;
}

export interface PlaylistWithSongs extends PlaylistDto {
	songs: SongDto[];
}

export interface PlaylistSummary extends PlaylistDto {
	songs?: SongDto[];
	totalSongsCount?: number;
}
