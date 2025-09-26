import * as React from 'react';
import { useEffect } from 'react';
import { NavLink as ReactNavLink, Outlet, useLocation } from 'react-router-dom';
import { AppShell, Box, Burger, Group, NavLink, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Logo } from './Logo.tsx';
import {
	IconHome2,
	IconListLetters,
	IconLogout,
	IconPlaylist,
	IconSearch,
	IconStar,
	IconUser,
} from '@tabler/icons-react';
import { useAuth } from 'react-oidc-context';
import { useAuthActions } from '../../hooks/auth.ts';

export const Layout: React.FC = () => {
	const { isAuthenticated, user } = useAuth();
	const { login, logout } = useAuthActions();
	const [opened, { toggle, close }] = useDisclosure();
	const location = useLocation();

	useEffect(() => {
		if (isAuthenticated && (window.location.search.includes('code=') || window.location.search.includes('state='))) {
			window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
		}
	}, [isAuthenticated]);

	React.useEffect(() => {
		close();
	}, [location.pathname, close]);

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
									active={location.pathname.includes('song')}
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
									active={location.pathname.includes('playlist')}
									component={ReactNavLink}
									to="/my-playlists"
									leftSection={<IconPlaylist size={16} stroke={1.5} />}
								/>
							</>
						)}
						<NavLink
							label="Search"
							active={location.pathname.includes('search')}
							component={ReactNavLink}
							to="/search"
							leftSection={<IconSearch size={16} stroke={1.5} />}
						/>
					</Box>

					<Box flex={'2 0 auto'}></Box>

					<Box>
						{isAuthenticated ? (
							<>
								<NavLink onClick={logout} leftSection={<IconLogout size={16} stroke={1.5} />} label="Logout" />
								<Group gap={12} py={8} px={12}>
									<IconUser size={16} stroke={1.5} />
									<Text size={'14px'}>{'Hi, ' + user?.profile?.nickname}</Text>
								</Group>
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
