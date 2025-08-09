import type { SongDto } from './song.ts';

export interface PlaylistDto {
	id: number;
	ownerId: string;
	title: string;
	description?: string | null;
}

export interface PlaylistMemberDto {
	id: number;
	playlistId: number;
	memberId: string;
}

export interface PlaylistSongDto {
	id: number;
	songId: number;
	playlistId: number;
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
