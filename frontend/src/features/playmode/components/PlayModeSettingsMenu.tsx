import { Group, Menu, NumberInput, Stack, Switch, Text } from '@mantine/core';
import { IconRefresh, IconSettings, IconX } from '@tabler/icons-react';
import type { PlayModeSettings } from '../types';

interface PlayModeSettingsMenuProps {
	settings: PlayModeSettings;
	onFontSizeChange: (size: number) => void;
	onHideChordsChange: (hide: boolean) => void;
	onSyncReload: () => void;
	onExit: () => void;
}

/**
 * Overflow menu on the play-mode top bar. Holds the explicit "exit" item,
 * the font-size + hide-chords settings, and the sync/reload button.
 */
export function PlayModeSettingsMenu({
	settings,
	onFontSizeChange,
	onHideChordsChange,
	onSyncReload,
	onExit,
}: PlayModeSettingsMenuProps) {
	return (
		<Menu shadow="md" width={260} position="bottom-start">
			<Menu.Target>
				{/* Target wrapped in a span so Menu can attach its ref */}
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
				<Menu.Label>Settings</Menu.Label>
				<Menu.Item closeMenuOnClick={false}>
					<Stack gap="xs">
						<Group justify="space-between">
							<Text size="sm">Font size</Text>
							<NumberInput
								size="xs"
								w={72}
								value={settings.fontSize}
								onChange={(v) => onFontSizeChange(Number(v))}
								min={10}
								max={40}
							/>
						</Group>
						<Group justify="space-between">
							<Text size="sm">Hide chords</Text>
							<Switch
								size="xs"
								checked={settings.hideChords}
								onChange={(e) => onHideChordsChange(e.currentTarget.checked)}
							/>
						</Group>
					</Stack>
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item leftSection={<IconRefresh size={14} />} onClick={onSyncReload}>
					Sync / reload
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
