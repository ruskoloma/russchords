import { useState } from 'react';
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

interface ViewerProps {
	musicText: string;
	defaultKey?: string;
	menuItems?: Array<React.ReactNode>;
}

export const Viewer: React.FC<ViewerProps> = ({ musicText, defaultKey, menuItems }) => {
	const [hideChords, setHideChords] = useState(false);
	const [hideControls, setHideControls] = useState(false);

	const parsed = parseSongText(musicText);
	const originalKey = getOriginalKey(parsed);
	const [key, setKey] = useState(defaultKey || originalKey || 'C');
	const [fontSize, setFontSize] = useState(16);

	const toKey = getKeyByName(key)!;

	const delta = originalKey ? getDelta(getKeyByName(originalKey).value, getKeyByName(key).value) : 0;

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
		const newKey = KEYS.reverse().find((k) => k.value == currentKey.value - 1 && ALL_ACTUAL_KEYS.includes(k.name));
		return newKey ? setKey(newKey.name) : setKey(KEYS.at(-1)!.name);
	};

	const handleKeyUp = () => {
		const currentKey = getKeyByName(key);
		const newKey = KEYS.find((k) => k.value == currentKey.value + 1 && ALL_ACTUAL_KEYS.includes(k.name));
		return newKey ? setKey(newKey.name) : setKey(KEYS[0].name!);
	};

	const handleFontSizeUp = () => {
		setFontSize((prev) => prev + 1);
	};

	const handleFontSizeDown = () => {
		setFontSize((prev) => Math.max(prev - 1, 10));
	};

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
