import {
	ActionIcon,
	Button,
	Divider,
	Drawer,
	Group,
	Kbd,
	SegmentedControl,
	Slider,
	Stack,
	Switch,
	Text,
} from '@mantine/core';
import { IconMinus, IconPlus, IconRefresh, IconRotate } from '@tabler/icons-react';
import type { SheetLayout } from '../../song/hooks/useViewerPrefs';
import { FONT_MAX, FONT_MIN } from '../../song/hooks/useViewerPrefs';
import { SCROLL_MAX, SCROLL_MIN, type StageSettings } from '../hooks/useStageSettings';

export interface StageKeyControls {
	key: string;
	baseKey: string;
	isTransposed: boolean;
	up: () => void;
	down: () => void;
	reset: () => void;
}

interface StageSettingsDrawerProps {
	opened: boolean;
	onClose: () => void;
	settings: StageSettings;
	onChange: (patch: Partial<StageSettings>) => void;
	onReset: () => void;
	onReload: () => void;
	/** Key of the current song; null when the song has no chords. */
	songKey: StageKeyControls | null;
	songName?: string;
	/** Actual text size after fit-to-width shrinking. */
	effectiveFontSize: number;
	canUseColumns: boolean;
	showShortcuts: boolean;
}

const SHORTCUTS: Array<[string[], string]> = [
	[['→'], 'Next song'],
	[['←'], 'Previous song'],
	[['PgDn', 'Space'], 'Scroll down (page-turn pedals)'],
	[['PgUp'], 'Scroll up'],
	[['A'], 'Start / pause auto-scroll'],
];

/**
 * Everything that changes how a song looks lives here, behind a deliberate
 * tap, so nothing can be changed by accident mid-song on the Stage screen.
 */
export function StageSettingsDrawer({
	opened,
	onClose,
	settings,
	onChange,
	onReset,
	onReload,
	songKey,
	songName,
	effectiveFontSize,
	canUseColumns,
	showShortcuts,
}: StageSettingsDrawerProps) {
	const shrunk = settings.fitWidth && effectiveFontSize < settings.fontSize;

	return (
		<Drawer opened={opened} onClose={onClose} title="Stage settings" position="right" size="sm" zIndex={300}>
			<Stack gap="lg">
				{songKey && (
					<>
						<Stack gap="sm">
							<div>
								<Text fw={700} size="sm">
									Key
								</Text>
								{songName && (
									<Text size="xs" c="dimmed" truncate>
										{songName} · remembered for this song
									</Text>
								)}
							</div>
							<Group justify="space-between" wrap="nowrap">
								<ActionIcon size="xl" variant="default" onClick={songKey.down} aria-label="Transpose down">
									<IconMinus size={18} />
								</ActionIcon>
								<div style={{ textAlign: 'center' }}>
									<Text fw={800} ff="monospace" size="xl" lh={1.1} aria-live="polite">
										{songKey.key}
									</Text>
									<Text size="xs" c="dimmed">
										{songKey.isTransposed ? `original ${songKey.baseKey}` : 'original key'}
									</Text>
								</div>
								<ActionIcon size="xl" variant="default" onClick={songKey.up} aria-label="Transpose up">
									<IconPlus size={18} />
								</ActionIcon>
							</Group>
							{songKey.isTransposed && (
								<Button variant="subtle" size="compact-sm" onClick={songKey.reset}>
									Back to {songKey.baseKey}
								</Button>
							)}
						</Stack>
						<Divider />
					</>
				)}

				<Stack gap="sm">
					<Text fw={700} size="sm">
						Text
					</Text>
					<div>
						<Group justify="space-between" mb={4}>
							<Text size="sm">Size</Text>
							<Text size="sm" c="dimmed">
								{settings.fontSize}px{shrunk ? ` · fits as ${Math.round(effectiveFontSize)}px` : ''}
							</Text>
						</Group>
						<Slider
							min={FONT_MIN}
							max={FONT_MAX}
							value={settings.fontSize}
							onChange={(fontSize) => onChange({ fontSize })}
							label={null}
							aria-label="Text size"
						/>
					</div>
					<Switch
						label="Fit to screen width"
						description="Shrinks long lines so nothing scrolls sideways"
						checked={settings.fitWidth}
						onChange={(e) => onChange({ fitWidth: e.currentTarget.checked })}
					/>
					<Switch
						label="Hide chords"
						description="Lyrics only — for singers"
						checked={settings.hideChords}
						onChange={(e) => onChange({ hideChords: e.currentTarget.checked })}
					/>
					{canUseColumns && (
						<div>
							<Text size="sm" mb={4}>
								Layout
							</Text>
							<SegmentedControl
								fullWidth
								value={settings.layout}
								onChange={(v) => onChange({ layout: v as SheetLayout })}
								data={[
									{ value: 'single', label: '1 column' },
									{ value: 'columns-song', label: '2 columns' },
									{ value: 'columns-sections', label: 'Split' },
								]}
							/>
						</div>
					)}
				</Stack>

				<Divider />

				<Stack gap="sm">
					<Text fw={700} size="sm">
						Auto-scroll
					</Text>
					<div>
						<Group justify="space-between" mb={4}>
							<Text size="sm">Speed</Text>
							<Text size="sm" c="dimmed">
								{settings.autoScrollSpeed} px/s
							</Text>
						</Group>
						<Slider
							min={SCROLL_MIN}
							max={SCROLL_MAX}
							step={5}
							value={settings.autoScrollSpeed}
							onChange={(autoScrollSpeed) => onChange({ autoScrollSpeed })}
							label={null}
							aria-label="Auto-scroll speed"
						/>
					</div>
					<Switch
						label="Start automatically"
						description="Begin scrolling when a song opens"
						checked={settings.autoScrollEnabled}
						onChange={(e) => onChange({ autoScrollEnabled: e.currentTarget.checked })}
					/>
				</Stack>

				<Divider />

				<Switch
					label="Dark screen"
					description="Dark, high-contrast screen for dim rooms"
					checked={settings.darkScreen}
					onChange={(e) => onChange({ darkScreen: e.currentTarget.checked })}
				/>

				<Group grow>
					<Button variant="default" leftSection={<IconRefresh size={16} />} onClick={onReload}>
						Reload songs
					</Button>
					<Button variant="default" leftSection={<IconRotate size={16} />} onClick={onReset}>
						Reset
					</Button>
				</Group>

				{showShortcuts && (
					<>
						<Divider />
						<Stack gap={8}>
							<Text fw={700} size="sm">
								Keyboard
							</Text>
							{SHORTCUTS.map(([keys, label]) => (
								<Group key={label} justify="space-between" wrap="nowrap">
									<Text size="sm">{label}</Text>
									<Group gap={4} wrap="nowrap">
										{keys.map((k) => (
											<Kbd key={k}>{k}</Kbd>
										))}
									</Group>
								</Group>
							))}
						</Stack>
					</>
				)}
			</Stack>
		</Drawer>
	);
}
