import { useCallback, useMemo, useState } from 'react';
import { ActionIcon, Box, Group, Menu, Select, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import {
	IconArrowsHorizontal,
	IconCheck,
	IconChevronDown,
	IconChevronUp,
	IconColumns1,
	IconColumns2,
	IconDotsVertical,
	IconGuitarPick,
	IconLayoutRows,
	IconMusic,
	IconMusicOff,
	IconRestore,
	IconTextDecrease,
	IconTextIncrease,
} from '@tabler/icons-react';
import { ALL_KEYS, parseSongText } from '../helpers/songParser';
import { computeCapoHint } from '../helpers/capoHint';
import { clampFont, FONT_MAX, FONT_MIN, type SheetLayout, useViewerPrefs } from '../hooks/useViewerPrefs';
import { useTransposition } from '../hooks/useTransposition';
import { SongSheet } from './SongSheet';
import { ChordDiagramsPanel } from './ChordDiagramsPanel';

interface SongViewerProps {
	content: string;
	/** Key the text is written in (song root note). Falls back to the first chord. */
	writtenKey?: string | null;
	/** Session-storage key for the chosen transposition, e.g. `song:42`. */
	storageKey?: string;
}

const LAYOUT_OPTIONS: Array<{ value: SheetLayout; label: string; icon: typeof IconColumns1 }> = [
	{ value: 'single', label: 'One column', icon: IconColumns1 },
	{ value: 'columns-song', label: 'Two columns', icon: IconColumns2 },
	{ value: 'columns-sections', label: 'Split each section', icon: IconLayoutRows },
];

/**
 * Song sheet with its controls: transpose, text size, chords on/off and a
 * menu with chord diagrams, fit-to-width and column layouts. All display
 * preferences are remembered on the device; the chosen key per song for the
 * browser session.
 */
export function SongViewer({ content, writtenKey, storageKey }: SongViewerProps) {
	const lines = useMemo(() => parseSongText(content), [content]);
	const t = useTransposition(lines, writtenKey, storageKey ? `russchords:key:${storageKey}` : undefined);
	const [prefs, setPrefs] = useViewerPrefs();
	const [effectiveFont, setEffectiveFont] = useState(prefs.fontSize);
	const canUseColumns = useMediaQuery('(min-width: 48em)', false, { getInitialValueInEffect: false });
	const layout: SheetLayout = canUseColumns ? prefs.layout : 'single';
	const capo = computeCapoHint(t.key);
	const hasChords = useMemo(() => lines.some((l) => l.type === 'chords'), [lines]);

	const onEffectiveFontSize = useCallback((size: number) => setEffectiveFont(size), []);

	const smaller = () => setPrefs({ fontSize: clampFont(Math.min(prefs.fontSize, effectiveFont) - 1) });
	const larger = () => {
		if (effectiveFont < prefs.fontSize) {
			// Fit-to-width is holding the text small: the user wants it bigger,
			// so stop fitting and let the line scroll sideways instead.
			setPrefs({ fitWidth: false, fontSize: clampFont(Math.floor(effectiveFont) + 1) });
		} else {
			setPrefs({ fontSize: clampFont(prefs.fontSize + 1) });
		}
	};

	const openDiagrams = () =>
		modals.open({
			title: `Chord diagrams · ${t.key}`,
			size: 'lg',
			children: <ChordDiagramsPanel content={lines} transposeChord={t.transpose} />,
		});

	return (
		<Box>
			<Box
				className="sticky-bar no-print"
				py={6}
				mx={-4}
				px={4}
				mb="sm"
				style={{ top: 'var(--app-shell-header-offset, 0px)' }}
			>
				<Group justify="space-between" wrap="nowrap" gap={6}>
					{hasChords ? (
						<Group gap={4} wrap="nowrap">
							<Tooltip label="Transpose down">
								<ActionIcon size="lg" variant="default" onClick={t.down} aria-label="Transpose down">
									<IconChevronDown size={18} />
								</ActionIcon>
							</Tooltip>
							<Select
								aria-label="Key"
								data={ALL_KEYS}
								value={t.key}
								onChange={t.setKey}
								w={72}
								size="sm"
								comboboxProps={{ width: 96, position: 'bottom-start' }}
								maxDropdownHeight={320}
								styles={{ input: { textAlign: 'center', fontWeight: 600, paddingInline: 8 } }}
								rightSection={null}
								rightSectionWidth={0}
								withCheckIcon={false}
							/>
							<Tooltip label="Transpose up">
								<ActionIcon size="lg" variant="default" onClick={t.up} aria-label="Transpose up">
									<IconChevronUp size={18} />
								</ActionIcon>
							</Tooltip>
						</Group>
					) : (
						<span />
					)}

					<Group gap={4} wrap="nowrap">
						<Tooltip label="Smaller text">
							<ActionIcon
								size="lg"
								variant="default"
								onClick={smaller}
								disabled={effectiveFont <= FONT_MIN}
								aria-label="Smaller text"
							>
								<IconTextDecrease size={18} />
							</ActionIcon>
						</Tooltip>
						<Tooltip label="Larger text">
							<ActionIcon
								size="lg"
								variant="default"
								onClick={larger}
								disabled={effectiveFont >= FONT_MAX}
								aria-label="Larger text"
							>
								<IconTextIncrease size={18} />
							</ActionIcon>
						</Tooltip>
						{hasChords && (
							<Tooltip label={prefs.hideChords ? 'Show chords' : 'Hide chords'}>
								<ActionIcon
									size="lg"
									variant={prefs.hideChords ? 'filled' : 'default'}
									color="brand"
									onClick={() => setPrefs({ hideChords: !prefs.hideChords })}
									aria-label={prefs.hideChords ? 'Show chords' : 'Hide chords'}
									aria-pressed={prefs.hideChords}
								>
									{prefs.hideChords ? <IconMusicOff size={18} /> : <IconMusic size={18} />}
								</ActionIcon>
							</Tooltip>
						)}
						<Menu position="bottom-end" width={240}>
							<Menu.Target>
								<ActionIcon size="lg" variant="default" aria-label="View options">
									<IconDotsVertical size={18} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								{hasChords && (
									<Menu.Item leftSection={<IconGuitarPick size={16} />} onClick={openDiagrams}>
										Chord diagrams
									</Menu.Item>
								)}
								<Menu.Item
									leftSection={<IconArrowsHorizontal size={16} />}
									rightSection={prefs.fitWidth ? <IconCheck size={14} /> : null}
									onClick={() => setPrefs({ fitWidth: !prefs.fitWidth })}
								>
									Fit to screen width
								</Menu.Item>
								{t.isTransposed && (
									<Menu.Item leftSection={<IconRestore size={16} />} onClick={t.reset}>
										Back to original key ({t.baseKey})
									</Menu.Item>
								)}
								{canUseColumns && (
									<>
										<Menu.Divider />
										<Menu.Label>Layout</Menu.Label>
										{LAYOUT_OPTIONS.map((o) => (
											<Menu.Item
												key={o.value}
												leftSection={<o.icon size={16} />}
												rightSection={prefs.layout === o.value ? <IconCheck size={14} /> : null}
												onClick={() => setPrefs({ layout: o.value })}
											>
												{o.label}
											</Menu.Item>
										))}
									</>
								)}
							</Menu.Dropdown>
						</Menu>
					</Group>
				</Group>

				{hasChords && (t.isTransposed || capo) && (
					<Group gap="xs" mt={6} wrap="wrap">
						{t.isTransposed && (
							<Text size="xs" c="dimmed">
								Original key {t.baseKey} ·{' '}
								<UnstyledButton onClick={t.reset} fz="xs" c="var(--mantine-primary-color-filled)" fw={600}>
									reset
								</UnstyledButton>
							</Text>
						)}
						{capo && (
							<Text size="xs" c="dimmed">
								Guitar: capo {capo.capoFret}, play {capo.playAsKey} shapes
							</Text>
						)}
					</Group>
				)}
			</Box>

			<SongSheet
				lines={lines}
				transpose={t.transpose}
				hideChords={prefs.hideChords}
				fontSize={prefs.fontSize}
				fitWidth={prefs.fitWidth}
				layout={layout}
				onEffectiveFontSize={onEffectiveFontSize}
			/>
		</Box>
	);
}
