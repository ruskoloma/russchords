import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalStorage, useMediaQuery } from '@mantine/hooks';
import {
	ALL_ACTUAL_KEYS,
	ALL_KEYS,
	type ChordToken,
	getDelta,
	getKeyByName,
	getOriginalKey,
	KEYS,
	parseSongText,
	transposeChordToken,
} from '../../helpers/songParser';
import { type ViewerLayoutMode, ViewerBase } from './ViewerBase.tsx';
import { ActionIcon, Group, Menu, Select } from '@mantine/core';
import { modals } from '@mantine/modals';
import {
	IconAdjustments,
	IconAdjustmentsOff,
	IconArrowDown,
	IconArrowUp,
	IconColumns2,
	IconColumns3,
	IconCopyright,
	IconDotsVertical,
	IconGuitarPick,
	IconList,
	IconMinus,
	IconNoCopyright,
	IconPlus,
} from '@tabler/icons-react';
import { CapoHintBadge } from '../CapoHintBadge';
import { ChordDiagramsPanel } from '../ChordDiagramsPanel';

interface ViewerProps {
	musicText: string;
	defaultKey?: string;
	menuItems?: Array<React.ReactNode>;
}

export const Viewer: React.FC<ViewerProps> = ({ musicText, defaultKey, menuItems }) => {
	const [hideChords, setHideChords] = useState(false);
	const [hideControls, setHideControls] = useState(false);
	const isTablet = useMediaQuery('(min-width: 48em)');
	const [layoutMode, setLayoutMode] = useLocalStorage<ViewerLayoutMode>({
		key: 'russchords-viewer-layout-mode',
		defaultValue: 'single',
	});

	// `parseSongText` walks the whole song content character-by-character. Prior
	// to memoization it ran on every render (key change, font-size tick, etc.)
	// which made transpose feel laggy for long songs. Key the memo on the raw
	// text: the parsed structure never depends on UI state.
	const parsed = useMemo(() => parseSongText(musicText), [musicText]);
	const originalKey = useMemo(() => getOriginalKey(parsed), [parsed]);

	const [displayRoot, setDisplayRoot] = useState<string>(defaultKey ?? originalKey ?? 'C');
	const [key, setKey] = useState(displayRoot);
	const [fontSize, setFontSize] = useState(16);

	useEffect(() => {
		const baseline = defaultKey ?? originalKey ?? 'C';
		setDisplayRoot(baseline);
		setKey(baseline);
	}, [defaultKey, originalKey]);

	const toKey = useMemo(() => getKeyByName(key)!, [key]);
	const delta = useMemo(
		() => getDelta(getKeyByName(displayRoot).value, toKey.value),
		[displayRoot, toKey],
	);

	// `ViewerBase` is memoized — it only re-renders when `transposeChord`'s
	// identity changes. Keeping this stable across renders means the chord
	// content map only re-runs when the transpose delta actually moves.
	const handleTransposeChord = useCallback(
		(t: ChordToken) => transposeChordToken(t, delta, toKey),
		[delta, toKey],
	);

	const handleChangeHideChords = useCallback(() => setHideChords((prev) => !prev), []);
	const handleChangeHideControls = useCallback(() => setHideControls((prev) => !prev), []);
	const handleChangeKey = useCallback((value: string | null) => setKey(value!), []);

	const handleKeyDown = useCallback(() => {
		const currentKey = getKeyByName(key);
		const newKey = [...KEYS].reverse().find((k) => k.value == currentKey.value - 1 && ALL_ACTUAL_KEYS.includes(k.name));
		return newKey ? setKey(newKey.name) : setKey(KEYS.at(-1)!.name);
	}, [key]);

	const handleKeyUp = useCallback(() => {
		const currentKey = getKeyByName(key);
		const newKey = KEYS.find((k) => k.value == currentKey.value + 1 && ALL_ACTUAL_KEYS.includes(k.name));
		return newKey ? setKey(newKey.name) : setKey(KEYS[1].name!);
	}, [key]);

	const handleFontSizeUp = useCallback(() => setFontSize((prev) => prev + 1), []);
	const handleFontSizeDown = useCallback(() => setFontSize((prev) => Math.max(prev - 1, 10)), []);
	const cycleLayout = useCallback(() => {
		setLayoutMode((prev) => {
			if (prev === 'single') return 'columns-song';
			if (prev === 'columns-song') return 'columns-sections';
			return 'single';
		});
	}, [setLayoutMode]);

	const openChordDiagrams = useCallback(() => {
		modals.open({
			title: 'Chord diagrams',
			size: 'lg',
			children: <ChordDiagramsPanel content={parsed} />,
		});
	}, [parsed]);
	const layoutLabel =
		layoutMode === 'single' ? 'Layout: Mobile' : layoutMode === 'columns-song' ? 'Layout: 2 Columns' : 'Layout: Section Split';
	const layoutColor = layoutMode === 'single' ? 'gray' : layoutMode === 'columns-song' ? 'blue' : 'teal';
	const LayoutIcon = layoutMode === 'single' ? IconList : layoutMode === 'columns-song' ? IconColumns2 : IconColumns3;
	const effectiveLayoutMode: ViewerLayoutMode = isTablet ? layoutMode : 'single';

	return (
		<div>
			<Group justify="space-between" h={'2.25em'} wrap="nowrap" gap="xs">
				<Group gap={4} wrap="nowrap">
					<ActionIcon onClick={handleChangeHideControls} aria-label={hideChords ? 'Unhide' : 'Hide'} size="sm">
						{hideControls ? <IconAdjustments size={18} /> : <IconAdjustmentsOff size={18} />}
					</ActionIcon>
					{!hideControls && (
						<ActionIcon onClick={handleChangeHideChords} aria-label={hideChords ? 'Unhide' : 'Hide'} size="sm">
							{hideChords ? <IconCopyright size={18} /> : <IconNoCopyright size={18} />}
						</ActionIcon>
					)}
				</Group>
				{!hideControls && (
					<Group gap={4} wrap="nowrap">
						<ActionIcon onClick={handleFontSizeDown} aria-label="Smaller font" disabled={fontSize < 5} size="sm">
							<IconMinus size={16} />
						</ActionIcon>
						<ActionIcon onClick={handleFontSizeUp} aria-label="Larger font" disabled={fontSize > 40} size="sm">
							<IconPlus size={16} />
						</ActionIcon>
					</Group>
				)}
				{!hideControls && (
					<Group gap={4} wrap="nowrap">
						<ActionIcon onClick={handleKeyDown} aria-label="Down" size="sm">
							<IconArrowDown size={16} />
						</ActionIcon>
						<Select placeholder="Key" data={ALL_KEYS} value={key} onChange={handleChangeKey} w="4.5em" size="xs" />
						<ActionIcon onClick={handleKeyUp} aria-label="Up" size="sm">
							<IconArrowUp size={16} />
						</ActionIcon>
						<CapoHintBadge songKey={key} />
					</Group>
				)}
				{!hideControls && (
					<Menu shadow="md" width={220}>
						<Menu.Target>
							<ActionIcon aria-label="Options" size="sm">
								<IconDotsVertical size={18} />
							</ActionIcon>
						</Menu.Target>

						<Menu.Dropdown>
							<Menu.Label>Tools</Menu.Label>
							<Menu.Item leftSection={<IconGuitarPick size={14} />} onClick={openChordDiagrams}>
								Chord diagrams
							</Menu.Item>
							{isTablet && (
								<Menu.Item leftSection={<LayoutIcon size={14} />} color={layoutColor} onClick={cycleLayout}>
									{layoutLabel}
								</Menu.Item>
							)}
							{menuItems && menuItems.length > 0 && (
								<>
									<Menu.Divider />
									<Menu.Label>Song</Menu.Label>
									{menuItems}
								</>
							)}
						</Menu.Dropdown>
					</Menu>
				)}
			</Group>
			<ViewerBase
				content={parsed}
				transposeChord={handleTransposeChord}
				hideChords={hideChords}
				fontSize={fontSize}
				layoutMode={effectiveLayoutMode}
			/>
		</div>
	);
};
