export interface SongDto {
	id: number;
	name: string;
	content: string;
	artist?: string;
	/** Free-form personal notes about the song — performance tips, arrangement reminders, etc. */
	description?: string | null;
	parentId?: number;
	originalId?: number;
	sourceUrl?: string;
	authorId: string;
	rootNote?: string;
}

export interface UpdateSongDto {
	name?: string;
	artist?: string | null;
	description?: string | null;
	content?: string;
	rootNote?: string | null;
}

export interface CreateSongDto {
	name: string;
	content: string;
	artist?: string | null;
	description?: string | null;
	rootNote?: string | null;
}
