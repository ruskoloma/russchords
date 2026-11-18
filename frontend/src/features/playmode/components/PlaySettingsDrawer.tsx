import { Button, Divider, Drawer, Group, Kbd, SegmentedControl, Slider, Stack, Switch, Text } from '@mantine/core';
import { IconRefresh, IconRotate } from '@tabler/icons-react';
import type { SheetLayout } from '../../song/hooks/useViewerPrefs';
import { FONT_MAX, FONT_MIN } from '../../song/hooks/useViewerPrefs';
import { SCROLL_MAX, SCROLL_MIN, type PlaySettings } from '../hooks/usePlaySettings';

interface PlaySettingsDrawerProps {
	opened: boolean;
	onClose: () => void;
	settings: PlaySettings;
	onChange: (patch: Partial<PlaySettings>) => void;
	onReset: () => void;
	onReload: () => void;
	canUseColumns: boolean;
	showShortcuts: boolean;
}

const SHORTCUTS: Array<[string[], string]> = [
	[['→'], 'Next song'],
	[['←'], 'Previous song'],
	[['PgDn', 'Space'], 'Scroll down (page-turn pedals)'],
	[['PgUp'], 'Scroll up'],
	[['+', '−'], 'Text size'],
	[['A'], 'Start / pause auto-scroll'],
];

export function PlaySettingsDrawer({
	opened,
	onClose,
	settings,
	onChange,
	onReset,
	onReload,
	canUseColumns,
	showShortcuts,
}: PlaySettingsDrawerProps) {
	return (
		<Drawer opened={opened} onClose={onClose} title="Play settings" position="right" size="sm" zIndex={300}>
			<Stack gap="lg">
				<Stack gap="sm">
					<Text fw={700} size="sm">
						Text
					</Text>
					<div>
						<Group justify="space-between" mb={4}>
							<Text size="sm">Size</Text>
							<Text size="sm" c="dimmed">
								{settings.fontSize}px
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
					label="Stage mode"
					description="Dark, high-contrast screen for dim rooms"
					checked={settings.stageMode}
					onChange={(e) => onChange({ stageMode: e.currentTarget.checked })}
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
