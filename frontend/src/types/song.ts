export interface SongDto {
	id: number;
	name: string;
	content: string;
	artist?: string;
	parentId?: number;
	originalId?: number;
	sourceUrl?: string;
	authorId: string;
	rootNote?: string;
}
