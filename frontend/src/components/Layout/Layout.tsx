import * as React from 'react';
import { useEffect } from 'react';
import { NavLink as ReactNavLink, Outlet, useLocation, useMatches, useNavigation } from 'react-router-dom';
import { Anchor, AppShell, Box, Burger, Group, NavLink, Stack, Text } from '@mantine/core';
import { NavigationProgress, nprogress } from '@mantine/nprogress';
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
import { useAuthActions } from '../../features/auth/hooks/auth.ts';
import { ColorSchemeToggle } from './ColorSchemeToggle';

const NavbarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
	const { isAuthenticated, user } = useAuth();
	const { login, logout } = useAuthActions();
	const location = useLocation();

	// Set aria-current="page" on the link whose `to` matches the current path
	// so screen readers announce the user's location in the nav tree.
	const isCurrent = (match: (pathname: string) => boolean) => (match(location.pathname) ? 'page' : undefined);

	return (
		<Stack h={'100%'}>
			<Box>
				<NavLink
					label="Home"
					active={location.pathname === '/'}
					component={ReactNavLink}
					to="/"
					onClick={onNavigate}
					aria-current={isCurrent((p) => p === '/')}
					leftSection={<IconHome2 size={16} stroke={1.5} />}
				/>
				{isAuthenticated && (
					<>
						<NavLink
							label="My Songs"
							active={location.pathname.includes('song')}
							component={ReactNavLink}
							to="/my-songs"
							onClick={onNavigate}
							aria-current={isCurrent((p) => p.includes('song'))}
							leftSection={<IconListLetters size={16} stroke={1.5} />}
						/>
						<NavLink
							label="Starred"
							active={location.pathname === '/starred'}
							component={ReactNavLink}
							to="/starred"
							onClick={onNavigate}
							aria-current={isCurrent((p) => p === '/starred')}
							leftSection={<IconStar size={16} stroke={1.5} />}
						/>
						<NavLink
							label="Playlists"
							active={location.pathname.includes('playlist')}
							component={ReactNavLink}
							to="/my-playlists"
							onClick={onNavigate}
							aria-current={isCurrent((p) => p.includes('playlist'))}
							leftSection={<IconPlaylist size={16} stroke={1.5} />}
						/>
					</>
				)}
				<NavLink
					label="Search"
					active={location.pathname.includes('search')}
					component={ReactNavLink}
					to="/search"
					onClick={onNavigate}
					aria-current={isCurrent((p) => p.includes('search'))}
					leftSection={<IconSearch size={16} stroke={1.5} />}
				/>
			</Box>

			<Box flex={'2 0 auto'}></Box>

			<Box>
				{isAuthenticated ? (
					<>
						<NavLink
							onClick={() => {
								logout();
								onNavigate?.();
							}}
							leftSection={<IconLogout size={16} stroke={1.5} />}
							label="Logout"
						/>
						<Group gap={12} py={8} px={12}>
							<IconUser size={16} stroke={1.5} />
							<Text size={'14px'}>{'Hi, ' + user?.profile?.nickname}</Text>
						</Group>
					</>
				) : (
					<NavLink
						onClick={() => {
							login();
							onNavigate?.();
						}}
						leftSection={<IconUser size={16} stroke={1.5} />}
						label="Login"
					/>
				)}
				<ColorSchemeToggle />
			</Box>
		</Stack>
	);
};

type RouteHandle = {
	immersiveMode?: boolean;
	/**
	 * Per-route max content width in pixels. Pages opt in via their route
	 * definition in main.tsx with e.g. `handle: { maxWidth: 1200 }`. Reader
	 * pages stay narrow (~820); table / dashboard pages open up to 1200.
	 * Falls back to `DEFAULT_CONTENT_MAX_WIDTH` for routes that don't set it.
	 */
	maxWidth?: number;
};

const DEFAULT_CONTENT_MAX_WIDTH = 820;

export const Layout: React.FC = () => {
	const { isAuthenticated } = useAuth();
	const [opened, { toggle, close }] = useDisclosure();
	const location = useLocation();
	const navigation = useNavigation();
	const matches = useMatches();

	// Check if any active route has the 'immersiveMode' handle
	const isImmersive = matches.some((match) => (match.handle as RouteHandle | undefined)?.immersiveMode);

	// Pick the innermost route's maxWidth, if any. `useMatches()` returns from
	// outer to inner so we walk backwards to the nearest override.
	const routeMaxWidth = [...matches]
		.reverse()
		.map((m) => (m.handle as RouteHandle | undefined)?.maxWidth)
		.find((w) => typeof w === 'number');

	useEffect(() => {
		if (navigation.state === 'loading') {
			nprogress.start();
		} else {
			nprogress.complete();
		}
	}, [navigation.state]);

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
			header={{ height: 50, collapsed: isImmersive }}
			navbar={{
				width: 300,
				breakpoint: 'md',
				collapsed: { mobile: !opened },
			}}
			padding="md"
		>
			{/* Skip-to-content link for keyboard + screen-reader users. Hidden
			    until focused (visuallyHidden) then pops into view at top-left. */}
			<Anchor
				href="#main-content"
				className="russchords-skip-link"
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					padding: '0.5rem 1rem',
					background: 'var(--mantine-color-brand-filled)',
					color: 'var(--mantine-color-white)',
					borderRadius: '0 0 var(--mantine-radius-md) 0',
					zIndex: 1000,
					transform: 'translateY(-200%)',
					transition: 'transform 150ms ease',
				}}
			>
				Skip to content
			</Anchor>
			<NavigationProgress />
			{!isImmersive && (
				<AppShell.Header>
					<Group justify={'space-between'} px={'lg'} fz={'h2'} h={'100%'}>
						<Logo />
						<Burger opened={opened} onClick={toggle} hiddenFrom="md" size="md" />
					</Group>
				</AppShell.Header>
			)}

			<AppShell.Navbar p="md">
				<NavbarContent onNavigate={close} />
			</AppShell.Navbar>

			<AppShell.Main id="main-content">
				<Box maw={isImmersive ? '100%' : (routeMaxWidth ?? DEFAULT_CONTENT_MAX_WIDTH)} m={'0 auto'}>
					<Outlet />
				</Box>
			</AppShell.Main>
		</AppShell>
	);
};
