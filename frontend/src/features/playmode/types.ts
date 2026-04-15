import type { MyPlaylistDto, SongDto } from '../../types';

/**
 * Data returned by the PlaylistPlayMode route loader. Carries the playlist
 * metadata plus the fully-hydrated song content for every song in the list.
 */
export interface PlayModeData {
	playlist: MyPlaylistDto;
	songs: SongDto[];
}

/**
 * User-tunable settings for play mode. Persisted to localStorage via
 * `usePlayModeSettings` so a performer's preferences survive session reloads.
 */
export interface PlayModeSettings {
	fontSize: number;
	hideChords: boolean;
}

export const DEFAULT_PLAY_MODE_SETTINGS: PlayModeSettings = {
	fontSize: 18,
	hideChords: false,
};
