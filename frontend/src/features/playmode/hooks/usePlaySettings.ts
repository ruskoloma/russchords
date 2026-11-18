import { usePersistentState } from '../../../lib/storage';
import { clampFont, type SheetLayout } from '../../song/hooks/useViewerPrefs';

export interface PlaySettings {
	fontSize: number;
	fitWidth: boolean;
	hideChords: boolean;
	layout: SheetLayout;
	/** Auto-scroll speed in px/s. */
	autoScrollSpeed: number;
	/** Start scrolling automatically when a song opens. */
	autoScrollEnabled: boolean;
	/** High-contrast dark theme regardless of the app theme. */
	stageMode: boolean;
}

export const DEFAULT_PLAY_SETTINGS: PlaySettings = {
	fontSize: 20,
	fitWidth: true,
	hideChords: false,
	layout: 'single',
	autoScrollSpeed: 25,
	autoScrollEnabled: false,
	stageMode: false,
};

export const SCROLL_MIN = 5;
export const SCROLL_MAX = 120;

function sanitize(raw: unknown): PlaySettings {
	const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const d = DEFAULT_PLAY_SETTINGS;
	const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
	// `layoutMode` is the field name used by earlier versions.
	const layout = (r.layout ?? r.layoutMode) as SheetLayout;
	return {
		fontSize: typeof r.fontSize === 'number' ? clampFont(r.fontSize) : d.fontSize,
		fitWidth: bool(r.fitWidth, d.fitWidth),
		hideChords: bool(r.hideChords, d.hideChords),
		layout: ['single', 'columns-song', 'columns-sections'].includes(layout) ? layout : d.layout,
		autoScrollSpeed:
			typeof r.autoScrollSpeed === 'number'
				? Math.min(SCROLL_MAX, Math.max(SCROLL_MIN, r.autoScrollSpeed))
				: d.autoScrollSpeed,
		autoScrollEnabled: bool(r.autoScrollEnabled, d.autoScrollEnabled),
		stageMode: bool(r.stageMode, d.stageMode),
	};
}

/** Play-mode preferences, remembered on this device. */
export function usePlaySettings() {
	const [settings, setSettings] = usePersistentState<PlaySettings>(
		'russchords-playmode-settings',
		DEFAULT_PLAY_SETTINGS,
		{
			sanitize,
		},
	);
	const update = (patch: Partial<PlaySettings>) => setSettings((prev) => ({ ...prev, ...patch }));
	const reset = () => setSettings(DEFAULT_PLAY_SETTINGS);
	return { settings, update, reset };
}
