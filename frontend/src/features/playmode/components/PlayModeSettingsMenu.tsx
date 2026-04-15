import { ActionIcon, Divider, Group, Menu, Slider, Stack, Switch, Text } from '@mantine/core';
import {
	IconMinus,
	IconPlus,
	IconRefresh,
	IconRotate,
	IconSettings,
	IconX,
} from '@tabler/icons-react';
import type { PlayModeSettings } from '../types';

interface PlayModeSettingsMenuProps {
	settings: PlayModeSettings;
	onFontSizeChange: (size: number) => void;
	onHideChordsChange: (hide: boolean) => void;
	onAutoScrollEnabledChange: (enabled: boolean) => void;
	onAutoScrollSpeedChange: (speed: number) => void;
	onStageModeChange: (stage: boolean) => void;
	onReset: () => void;
	onSyncReload: () => void;
	onExit: () => void;
}

/**
 * Overflow menu on the play-mode top bar. Holds the explicit "exit" item,
 * the font-size stepper, hide-chords toggle, auto-scroll settings, stage
 * mode toggle, settings reset, and sync/reload.
 *
 * Font size is now a pair of big +/- ActionIcons with the current size
 * shown between them, replacing the fiddly NumberInput.
 */
export function PlayModeSettingsMenu({
	settings,
	onFontSizeChange,
	onHideChordsChange,
	onAutoScrollEnabledChange,
	onAutoScrollSpeedChange,
	onStageModeChange,
	onReset,
	onSyncReload,
	onExit,
}: PlayModeSettingsMenuProps) {
	const clampFont = (value: number) => Math.min(40, Math.max(10, value));

	return (
		<Menu shadow="md" width={300} position="bottom-start" closeOnItemClick={false}>
			<Menu.Target>
				<button
					type="button"
					aria-label="Play mode options"
					style={{
						background: 'none',
						border: 'none',
						padding: 4,
						cursor: 'pointer',
						color: 'var(--mantine-color-text)',
					}}
				>
					<IconSettings size={22} />
				</button>
			</Menu.Target>

			<Menu.Dropdown>
				<Menu.Item leftSection={<IconX size={14} />} color="red" onClick={onExit}>
					Exit Play Mode
				</Menu.Item>
				<Menu.Divider />

				<Menu.Label>Display</Menu.Label>
				<Stack gap="sm" px="sm" py="xs">
					<Group justify="space-between" wrap="nowrap">
						<Text size="sm">Font size</Text>
						<Group gap={4} wrap="nowrap">
							<ActionIcon
								variant="default"
								size="md"
								onClick={() => onFontSizeChange(clampFont(settings.fontSize - 2))}
								disabled={settings.fontSize <= 10}
								aria-label="Decrease font size"
							>
								<IconMinus size={16} />
							</ActionIcon>
							<Text size="sm" fw={600} w={32} ta="center">
								{settings.fontSize}
							</Text>
							<ActionIcon
								variant="default"
								size="md"
								onClick={() => onFontSizeChange(clampFont(settings.fontSize + 2))}
								disabled={settings.fontSize >= 40}
								aria-label="Increase font size"
							>
								<IconPlus size={16} />
							</ActionIcon>
						</Group>
					</Group>
					<Group justify="space-between">
						<Text size="sm">Hide chords</Text>
						<Switch
							size="sm"
							checked={settings.hideChords}
							onChange={(e) => onHideChordsChange(e.currentTarget.checked)}
						/>
					</Group>
					<Group justify="space-between">
						<Text size="sm">Stage mode</Text>
						<Switch
							size="sm"
							checked={settings.stageMode}
							onChange={(e) => onStageModeChange(e.currentTarget.checked)}
						/>
					</Group>
				</Stack>

				<Divider />

				<Menu.Label>Auto-scroll</Menu.Label>
				<Stack gap="sm" px="sm" py="xs">
					<Group justify="space-between">
						<Text size="sm">Enabled</Text>
						<Switch
							size="sm"
							checked={settings.autoScrollEnabled}
							onChange={(e) => onAutoScrollEnabledChange(e.currentTarget.checked)}
						/>
					</Group>
					<Stack gap={4}>
						<Group justify="space-between">
							<Text size="sm">Speed</Text>
							<Text size="xs" c="dimmed">
								{settings.autoScrollSpeed} px/s
							</Text>
						</Group>
						<Slider
							min={5}
							max={80}
							step={5}
							value={settings.autoScrollSpeed}
							onChange={onAutoScrollSpeedChange}
							label={null}
						/>
					</Stack>
				</Stack>

				<Menu.Divider />

				<Menu.Item leftSection={<IconRotate size={14} />} onClick={onReset}>
					Reset settings
				</Menu.Item>
				<Menu.Item leftSection={<IconRefresh size={14} />} onClick={onSyncReload}>
					Sync / reload
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
