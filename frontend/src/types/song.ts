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
	/** Free-form user-assigned tags. Defaults to [] when the backend is pre-migration. */
	tags?: string[];
}

export interface UpdateSongDto {
	name?: string;
	artist?: string | null;
	description?: string | null;
	content?: string;
	rootNote?: string | null;
	/** Null = don't touch tags; any other value (incl. empty array) replaces the whole set. */
	tags?: string[] | null;
}

export interface CreateSongDto {
	name: string;
	content: string;
	artist?: string | null;
	description?: string | null;
	rootNote?: string | null;
	tags?: string[];
}
