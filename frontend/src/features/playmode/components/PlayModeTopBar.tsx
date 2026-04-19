import { ActionIcon, Group } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconMinus, IconPlus } from '@tabler/icons-react';
import type { SongDto } from '../../../types';
import type { PlayModeSettings } from '../types';
import { PlayModeSettingsMenu } from './PlayModeSettingsMenu';
import { SongPicker } from './SongPicker';

interface PlayModeTopBarProps {
	songs: SongDto[];
	currentIndex: number;
	isFirst: boolean;
	isLast: boolean;
	settings: PlayModeSettings;
	isLayoutSwitchEnabled: boolean;
	onPrev: () => void;
	onNext: () => void;
	onPick: (index: number) => void;
	onFontSizeChange: (size: number) => void;
	onHideChordsChange: (hide: boolean) => void;
	onAutoScrollEnabledChange: (enabled: boolean) => void;
	onAutoScrollSpeedChange: (speed: number) => void;
	onStageModeChange: (stage: boolean) => void;
	onLayoutModeChange: (mode: PlayModeSettings['layoutMode']) => void;
	onResetSettings: () => void;
	onSyncReload: () => void;
	onExit: () => void;
}

/**
 * Sticky top bar shown during play mode. Left side has the overflow
 * settings menu + previous-song button; center is the song picker; right
 * side is the next-song button.
 *
 * Background + border use theme CSS variables so the bar auto-themes
 * across light and dark mode.
 */
export function PlayModeTopBar({
	songs,
	currentIndex,
	isFirst,
	isLast,
	settings,
	isLayoutSwitchEnabled,
	onPrev,
	onNext,
	onPick,
	onFontSizeChange,
	onHideChordsChange,
	onAutoScrollEnabledChange,
	onAutoScrollSpeedChange,
	onStageModeChange,
	onLayoutModeChange,
	onResetSettings,
	onSyncReload,
	onExit,
}: PlayModeTopBarProps) {
	return (
		<Group
			justify="space-between"
			p="xs"
			style={{
				backgroundColor: 'var(--mantine-color-body)',
				borderBottom: '1px solid var(--mantine-color-default-border)',
				position: 'sticky',
				top: 0,
				zIndex: 10,
			}}
			wrap="nowrap"
			m="-1rem -1rem 0"
		>
			<Group gap={4} wrap="nowrap">
				<PlayModeSettingsMenu
					settings={settings}
					isLayoutSwitchEnabled={isLayoutSwitchEnabled}
					onFontSizeChange={onFontSizeChange}
					onHideChordsChange={onHideChordsChange}
					onAutoScrollEnabledChange={onAutoScrollEnabledChange}
					onAutoScrollSpeedChange={onAutoScrollSpeedChange}
					onStageModeChange={onStageModeChange}
					onLayoutModeChange={onLayoutModeChange}
					onReset={onResetSettings}
					onSyncReload={onSyncReload}
					onExit={onExit}
				/>
				<ActionIcon
					variant="subtle"
					color="gray"
					onClick={() => onFontSizeChange(Math.max(10, settings.fontSize - 2))}
					disabled={settings.fontSize <= 10}
					aria-label="Smaller font"
					size="lg"
				>
					<IconMinus size={20} />
				</ActionIcon>
				<ActionIcon
					variant="subtle"
					color="gray"
					onClick={() => onFontSizeChange(Math.min(40, settings.fontSize + 2))}
					disabled={settings.fontSize >= 40}
					aria-label="Larger font"
					size="lg"
				>
					<IconPlus size={20} />
				</ActionIcon>
				<ActionIcon
					variant="subtle"
					color="gray"
					onClick={onPrev}
					disabled={isFirst}
					aria-label="Previous song"
					size="lg"
				>
					<IconChevronLeft size={24} />
				</ActionIcon>
			</Group>

			<SongPicker songs={songs} currentIndex={currentIndex} onPick={onPick} />

			<ActionIcon
				variant="subtle"
				color="gray"
				onClick={onNext}
				disabled={isLast}
				aria-label="Next song"
				size="lg"
			>
				<IconChevronRight size={24} />
			</ActionIcon>
		</Group>
	);
}
