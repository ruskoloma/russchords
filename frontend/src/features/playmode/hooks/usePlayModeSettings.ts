import { useCallback } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { DEFAULT_PLAY_MODE_SETTINGS, type PlayModeSettings } from '../types';

const STORAGE_KEY = 'russchords-playmode-settings';

/**
 * Wraps `useLocalStorage` for the play mode settings with a stable setter API
 * plus individual field helpers. Exposing dedicated setters avoids callers
 * having to spread the previous value every time they want to change one key.
 *
 * Merges defaults on read so any fields added to PlayModeSettings in future
 * releases are auto-populated for users whose localStorage was written by an
 * earlier version.
 */
export function usePlayModeSettings() {
	const [raw, setSettings] = useLocalStorage<PlayModeSettings>({
		key: STORAGE_KEY,
		defaultValue: DEFAULT_PLAY_MODE_SETTINGS,
	});

	// Back-fill any fields missing from older persisted values so users never
	// see `undefined` crash the settings UI after an upgrade.
	const settings: PlayModeSettings = { ...DEFAULT_PLAY_MODE_SETTINGS, ...raw };

	const setFontSize = useCallback(
		(fontSize: number) => {
			setSettings((prev) => ({ ...DEFAULT_PLAY_MODE_SETTINGS, ...prev, fontSize }));
		},
		[setSettings],
	);

	const setHideChords = useCallback(
		(hideChords: boolean) => {
			setSettings((prev) => ({ ...DEFAULT_PLAY_MODE_SETTINGS, ...prev, hideChords }));
		},
		[setSettings],
	);

	const setAutoScrollSpeed = useCallback(
		(autoScrollSpeed: number) => {
			setSettings((prev) => ({ ...DEFAULT_PLAY_MODE_SETTINGS, ...prev, autoScrollSpeed }));
		},
		[setSettings],
	);

	const setAutoScrollEnabled = useCallback(
		(autoScrollEnabled: boolean) => {
			setSettings((prev) => ({ ...DEFAULT_PLAY_MODE_SETTINGS, ...prev, autoScrollEnabled }));
		},
		[setSettings],
	);

	const setStageMode = useCallback(
		(stageMode: boolean) => {
			setSettings((prev) => ({ ...DEFAULT_PLAY_MODE_SETTINGS, ...prev, stageMode }));
		},
		[setSettings],
	);

	const setLayoutMode = useCallback(
		(layoutMode: PlayModeSettings['layoutMode']) => {
			setSettings((prev) => ({ ...DEFAULT_PLAY_MODE_SETTINGS, ...prev, layoutMode }));
		},
		[setSettings],
	);

	const reset = useCallback(() => {
		setSettings(DEFAULT_PLAY_MODE_SETTINGS);
	}, [setSettings]);

	return {
		settings,
		setFontSize,
		setHideChords,
		setAutoScrollSpeed,
		setAutoScrollEnabled,
		setStageMode,
		setLayoutMode,
		reset,
	};
}
