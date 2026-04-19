import type { ViewerLayoutMode } from '../song/components/Viewer/ViewerBase';
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
	layoutMode: ViewerLayoutMode;
	/**
	 * Auto-scroll speed in pixels/second. 0 = disabled. Typical range 10–80,
	 * calibrated so a slow ballad can scroll at ~15 and an upbeat song at ~45.
	 */
	autoScrollSpeed: number;
	/**
	 * When true, auto-scroll starts automatically whenever a song loads.
	 * Separate toggle from `autoScrollSpeed` so performers can configure
	 * the speed without committing to hands-off scrolling.
	 */
	autoScrollEnabled: boolean;
	/**
	 * Stage mode — forces the play mode UI into a high-contrast dark theme
	 * regardless of the global color scheme. Performers keep the app in
	 * light mode for rehearsal but flip to stage mode for live performance.
	 */
	stageMode: boolean;
}

export const DEFAULT_PLAY_MODE_SETTINGS: PlayModeSettings = {
	fontSize: 18,
	hideChords: false,
	layoutMode: 'single',
	autoScrollSpeed: 25,
	autoScrollEnabled: false,
	stageMode: false,
};
