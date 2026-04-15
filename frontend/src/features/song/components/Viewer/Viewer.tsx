import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ViewerBase } from './ViewerBase.tsx';
import { ActionIcon, Group, Menu, Select } from '@mantine/core';
import {
	IconAdjustments,
	IconAdjustmentsOff,
	IconArrowDown,
	IconArrowUp,
	IconCopyright,
	IconDotsVertical,
	IconMinus,
	IconNoCopyright,
	IconPlus,
} from '@tabler/icons-react';
import { CapoHintBadge } from '../CapoHintBadge';

interface ViewerProps {
	musicText: string;
	defaultKey?: string;
	menuItems?: Array<React.ReactNode>;
}

export const Viewer: React.FC<ViewerProps> = ({ musicText, defaultKey, menuItems }) => {
	const [hideChords, setHideChords] = useState(false);
	const [hideControls, setHideControls] = useState(false);

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

	return (
		<div>
			<Group justify="space-between" h={'2.25em'}>
				<Group gap="0.25em">
					<ActionIcon onClick={handleChangeHideControls} aria-label={hideChords ? 'Unhide' : 'Hide'}>
						{hideControls ? <IconAdjustments /> : <IconAdjustmentsOff />}
					</ActionIcon>
					{!hideControls && (
						<ActionIcon onClick={handleChangeHideChords} aria-label={hideChords ? 'Unhide' : 'Hide'}>
							{hideChords ? <IconCopyright /> : <IconNoCopyright />}
						</ActionIcon>
					)}
				</Group>
				{!hideControls && (
					<Group gap="0.25em">
						<ActionIcon onClick={handleFontSizeDown} aria-label="Smaller font" disabled={fontSize < 5}>
							<IconMinus />
						</ActionIcon>
						<ActionIcon onClick={handleFontSizeUp} aria-label="Larger font" disabled={fontSize > 40}>
							<IconPlus />
						</ActionIcon>
					</Group>
				)}
				{!hideControls && (
					<Group gap="0.25em" wrap="nowrap">
						<ActionIcon onClick={handleKeyDown} aria-label="Down">
							<IconArrowDown />
						</ActionIcon>
						<Select placeholder="Select key" data={ALL_KEYS} value={key} onChange={handleChangeKey} w="5em" />
						<ActionIcon onClick={handleKeyUp} aria-label="Up">
							<IconArrowUp />
						</ActionIcon>
						<CapoHintBadge songKey={key} />
					</Group>
				)}
				{!hideControls && menuItems?.length && (
					<Group>
						<Menu shadow="md" width={200}>
							<Menu.Target>
								<ActionIcon aria-label="Options">
									<IconDotsVertical />
								</ActionIcon>
							</Menu.Target>

							<Menu.Dropdown>
								<Menu.Label>Options</Menu.Label>
								{menuItems}
							</Menu.Dropdown>
						</Menu>
					</Group>
				)}
			</Group>
			<ViewerBase content={parsed} transposeChord={handleTransposeChord} hideChords={hideChords} fontSize={fontSize} />
		</div>
	);
};
