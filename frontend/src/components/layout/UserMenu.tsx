import { Avatar, Button, Group, Menu, Text, UnstyledButton, useMantineColorScheme } from '@mantine/core';
import { IconCheck, IconDeviceDesktop, IconLogin, IconLogout, IconMoon, IconSun } from '@tabler/icons-react';
import { useSession } from '../../auth/useSession';
import { signIn, signOut } from '../../auth/actions';

function initials(name: string | null) {
	if (!name) return '?';
	return name
		.split(/[\s@._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0]!.toUpperCase())
		.join('');
}

function ThemeItems() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();
	const options = [
		{ value: 'light', label: 'Light', icon: IconSun },
		{ value: 'dark', label: 'Dark', icon: IconMoon },
		{ value: 'auto', label: 'System', icon: IconDeviceDesktop },
	] as const;
	return (
		<>
			<Menu.Label>Theme</Menu.Label>
			{options.map(({ value, label, icon: Icon }) => (
				<Menu.Item
					key={value}
					leftSection={<Icon size={16} />}
					rightSection={colorScheme === value ? <IconCheck size={14} /> : null}
					onClick={() => setColorScheme(value)}
				>
					{label}
				</Menu.Item>
			))}
		</>
	);
}

/**
 * Account + theme menu. `variant="full"` (desktop sidebar) shows the name next
 * to the avatar; `variant="compact"` (mobile header) is avatar-only.
 */
export function UserMenu({ variant }: { variant: 'full' | 'compact' }) {
	const { isSignedIn, displayName, email } = useSession();

	if (!isSignedIn) {
		return (
			<Group gap="xs" wrap="nowrap">
				<Menu position={variant === 'full' ? 'top-start' : 'bottom-end'} width={200}>
					<Menu.Target>
						<UnstyledButton aria-label="Theme" p={4}>
							<Avatar radius="xl" size={variant === 'full' ? 36 : 32} color="gray">
								<IconSun size={16} />
							</Avatar>
						</UnstyledButton>
					</Menu.Target>
					<Menu.Dropdown>
						<ThemeItems />
					</Menu.Dropdown>
				</Menu>
				<Button
					leftSection={<IconLogin size={16} />}
					onClick={() => void signIn()}
					size={variant === 'full' ? 'sm' : 'compact-md'}
					fullWidth={variant === 'full'}
				>
					Sign in
				</Button>
			</Group>
		);
	}

	return (
		<Menu position={variant === 'full' ? 'top-start' : 'bottom-end'} width={240}>
			<Menu.Target>
				<UnstyledButton
					aria-label="Account menu"
					p={variant === 'full' ? 6 : 2}
					style={{ borderRadius: 'var(--mantine-radius-md)', width: variant === 'full' ? '100%' : undefined }}
				>
					<Group gap="sm" wrap="nowrap">
						<Avatar radius="xl" size={variant === 'full' ? 36 : 32} color="brand">
							{initials(displayName)}
						</Avatar>
						{variant === 'full' && (
							<div style={{ minWidth: 0 }}>
								<Text size="sm" fw={600} truncate>
									{displayName}
								</Text>
								{email && email !== displayName && (
									<Text size="xs" c="dimmed" truncate>
										{email}
									</Text>
								)}
							</div>
						)}
					</Group>
				</UnstyledButton>
			</Menu.Target>
			<Menu.Dropdown>
				{variant === 'compact' && (
					<>
						<Menu.Label>
							<Text size="sm" fw={600} c="var(--mantine-color-text)" truncate>
								{displayName}
							</Text>
						</Menu.Label>
						<Menu.Divider />
					</>
				)}
				<ThemeItems />
				<Menu.Divider />
				<Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={() => void signOut()}>
					Sign out
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
