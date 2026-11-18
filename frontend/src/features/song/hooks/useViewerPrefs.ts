import { usePersistentState } from '../../../lib/storage';

export type SheetLayout = 'single' | 'columns-song' | 'columns-sections';

export interface ViewerPrefs {
	fontSize: number;
	hideChords: boolean;
	layout: SheetLayout;
	/** Shrink the font so the widest line fits the screen (no sideways scroll). */
	fitWidth: boolean;
}

export const FONT_MIN = 10;
export const FONT_MAX = 40;

const DEFAULT_PREFS: ViewerPrefs = { fontSize: 16, hideChords: false, layout: 'single', fitWidth: true };
const LAYOUTS: SheetLayout[] = ['single', 'columns-song', 'columns-sections'];

export const clampFont = (n: number) => Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)));

function sanitize(raw: unknown): ViewerPrefs {
	const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<ViewerPrefs>;
	return {
		fontSize: typeof r.fontSize === 'number' ? clampFont(r.fontSize) : DEFAULT_PREFS.fontSize,
		hideChords: typeof r.hideChords === 'boolean' ? r.hideChords : DEFAULT_PREFS.hideChords,
		layout: LAYOUTS.includes(r.layout as SheetLayout) ? (r.layout as SheetLayout) : DEFAULT_PREFS.layout,
		fitWidth: typeof r.fitWidth === 'boolean' ? r.fitWidth : DEFAULT_PREFS.fitWidth,
	};
}

/** Song-sheet display preferences, remembered on this device. */
export function useViewerPrefs() {
	const [prefs, setPrefs] = usePersistentState<ViewerPrefs>('russchords-viewer-prefs', DEFAULT_PREFS, { sanitize });
	const update = (patch: Partial<ViewerPrefs>) => setPrefs((prev) => ({ ...prev, ...patch }));
	return [prefs, update] as const;
}
