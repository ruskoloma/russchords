import { useEffect, useState } from 'react';
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
import { useLocalStorage, useMediaQuery } from '@mantine/hooks';
import {
	IconAdjustments,
	IconAdjustmentsOff,
	IconArrowDown,
	IconArrowUp,
	IconColumns2,
	IconColumns3,
	IconCopyright,
	IconDotsVertical,
	IconList,
	IconMinus,
	IconNoCopyright,
	IconPlus,
} from '@tabler/icons-react';

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

	const parsed = parseSongText(musicText);
	const originalKey = getOriginalKey(parsed);
	const [displayRoot, setDisplayRoot] = useState<string>(defaultKey ?? originalKey ?? 'C');
	useEffect(() => {
		const baseline = defaultKey ?? originalKey ?? 'C';
		setDisplayRoot(baseline);
		setKey(baseline);
	}, [defaultKey, originalKey]);
	const [key, setKey] = useState(displayRoot);
	const [fontSize, setFontSize] = useState(16);

	const toKey = getKeyByName(key)!;

	const delta = getDelta(getKeyByName(displayRoot).value, getKeyByName(key).value);

	const handleChangeHideChords = () => {
		setHideChords((prev) => !prev);
	};

	const handleChangeHideControls = () => {
		setHideControls((prev) => !prev);
	};

	const handleChangeKey = (value: string | null) => {
		setKey(value!);
	};

	const handleKeyDown = () => {
		const currentKey = getKeyByName(key);
		const newKey = [...KEYS].reverse().find((k) => k.value == currentKey.value - 1 && ALL_ACTUAL_KEYS.includes(k.name));
		return newKey ? setKey(newKey.name) : setKey(KEYS.at(-1)!.name);
	};

	const handleKeyUp = () => {
		const currentKey = getKeyByName(key);
		const newKey = KEYS.find((k) => k.value == currentKey.value + 1 && ALL_ACTUAL_KEYS.includes(k.name));
		return newKey ? setKey(newKey.name) : setKey(KEYS[1].name!);
	};

	const handleFontSizeUp = () => {
		setFontSize((prev) => prev + 1);
	};

	const handleFontSizeDown = () => {
		setFontSize((prev) => Math.max(prev - 1, 10));
	};

	const cycleLayout = () => {
		setLayoutMode((prev) => {
			if (prev === 'single') return 'columns-song';
			if (prev === 'columns-song') return 'columns-sections';
			return 'single';
		});
	};

	const layoutLabel =
		layoutMode === 'single' ? 'Layout: Mobile' : layoutMode === 'columns-song' ? 'Layout: 2 Columns' : 'Layout: Section Split';
	const layoutColor = layoutMode === 'single' ? 'gray' : layoutMode === 'columns-song' ? 'blue' : 'teal';
	const effectiveLayoutMode: ViewerLayoutMode = isTablet ? layoutMode : 'single';
	const hasLayoutSwitcher = Boolean(isTablet);
	const hasMenu = hasLayoutSwitcher || Boolean(menuItems?.length);

	const handleTransposeChord = (t: ChordToken) => transposeChordToken(t, delta, toKey);

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
					<Group gap="0.25em">
						<ActionIcon onClick={handleKeyDown} aria-label="Down">
							<IconArrowDown />
						</ActionIcon>
						<Select placeholder="Select key" data={ALL_KEYS} value={key} onChange={handleChangeKey} w="5em" />
						<ActionIcon onClick={handleKeyUp} aria-label="Up">
							<IconArrowUp />
						</ActionIcon>
					</Group>
				)}
				{!hideControls && hasMenu && (
					<Group>
						<Menu shadow="md" width={200}>
							<Menu.Target>
								<ActionIcon aria-label="Options">
									<IconDotsVertical />
								</ActionIcon>
							</Menu.Target>

							<Menu.Dropdown>
								<Menu.Label>Options</Menu.Label>
								{hasLayoutSwitcher && (
									<>
										<Menu.Item
											color={layoutColor}
											leftSection={
												layoutMode === 'single' ? <IconList size={14} /> : layoutMode === 'columns-song' ? <IconColumns2 size={14} /> : <IconColumns3 size={14} />
											}
											onClick={cycleLayout}
										>
											{layoutLabel}
										</Menu.Item>
										{menuItems?.length ? <Menu.Divider /> : null}
									</>
								)}
								{menuItems}
							</Menu.Dropdown>
						</Menu>
					</Group>
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
