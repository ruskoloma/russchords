import * as React from 'react';
import { NavLink as ReactNavLink, Outlet } from 'react-router-dom';
import { AppShell, Box, Burger, Group, NavLink, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Logo } from './Logo.tsx';
import { IconHome2, IconListLetters, IconLogout, IconPlaylist, IconStar, IconUser } from '@tabler/icons-react';
import { useAuth } from 'react-oidc-context';
import { useAuthActions } from '../../hooks/auth.ts';

export const Layout: React.FC = () => {
	const { isAuthenticated, user } = useAuth();
	const { login, logout } = useAuthActions();
	const [opened, { toggle }] = useDisclosure();

	return (
		<AppShell
			header={{ height: 50 }}
			navbar={{
				width: 300,
				breakpoint: 'md',
				collapsed: { mobile: !opened },
			}}
			padding="md"
		>
			<AppShell.Header>
				<Group justify={'space-between'} px={'lg'} fz={'h2'} h={'100%'}>
					<Logo />
					<Burger opened={opened} onClick={toggle} hiddenFrom="md" size="md" />
				</Group>
			</AppShell.Header>

			<AppShell.Navbar p="md">
				<Stack h={'100%'}>
					<Box>
						<NavLink
							label="Home"
							active={location.pathname === '/'}
							component={ReactNavLink}
							to="/"
							leftSection={<IconHome2 size={16} stroke={1.5} />}
						/>
						{isAuthenticated && (
							<>
								<NavLink
									label="My Songs"
									active={location.pathname === 'my-songs'}
									component={ReactNavLink}
									to="/my-songs"
									leftSection={<IconListLetters size={16} stroke={1.5} />}
								/>
								<NavLink
									label="Starred"
									active={location.pathname === 'starred'}
									component={ReactNavLink}
									to="/starred"
									leftSection={<IconStar size={16} stroke={1.5} />}
								/>
								<NavLink
									label="Playlists"
									active={location.pathname === 'my-playlists'}
									component={ReactNavLink}
									to="/my-playlists"
									leftSection={<IconPlaylist size={16} stroke={1.5} />}
								/>
							</>
						)}
					</Box>

					<Box flex={'2 0 auto'}></Box>

					<Box>
						{isAuthenticated ? (
							<>
								<NavLink onClick={logout} leftSection={<IconLogout size={16} stroke={1.5} />} label="Logout" />
								<NavLink leftSection={<IconUser size={16} stroke={1.5} />} label={'Hi, ' + user?.profile?.nickname} />
							</>
						) : (
							<NavLink onClick={login} leftSection={<IconUser size={16} stroke={1.5} />} label="Login" />
						)}
					</Box>
				</Stack>
			</AppShell.Navbar>

			<AppShell.Main>
				<Box maw={'750px'} m={'0 auto'}>
					<Outlet />
				</Box>
			</AppShell.Main>
		</AppShell>
	);
};
