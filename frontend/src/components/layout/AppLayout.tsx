import { useEffect } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation, useMatches, useNavigation } from 'react-router-dom';
import { AppShell, Box, Button, Group, NavLink, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { NavigationProgress, nprogress } from '@mantine/nprogress';
import { IconLogin, IconPlus } from '@tabler/icons-react';
import { useSession } from '../../auth/useSession';
import { signIn } from '../../auth/actions';
import { NAV_ITEMS } from './navItems';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';

export interface RouteHandle {
	/** Full-screen page without navigation chrome (Stage). */
	immersive?: boolean;
	/** Max content width in px. Reading pages stay narrow, lists go wider. */
	maxWidth?: number;
}

const DEFAULT_MAX_WIDTH = 880;
export const DESKTOP_QUERY = '(min-width: 62em)';

function SideNav() {
	const { isSignedIn } = useSession();
	const { pathname } = useLocation();

	return (
		<Stack h="100%" gap={0}>
			<Box px="md" pt="lg" pb="md">
				<Logo />
			</Box>
			<Box flex={1} px="sm" style={{ overflowY: 'auto' }}>
				<Stack gap={2} component="nav" aria-label="Main">
					{NAV_ITEMS.filter((i) => !i.requiresAuth || isSignedIn).map((item) => {
						const active = item.isActive(pathname);
						return (
							<NavLink
								key={item.to}
								component={Link}
								to={item.to}
								label={item.label}
								active={active}
								aria-current={active ? 'page' : undefined}
								leftSection={<item.icon size={20} stroke={1.75} />}
								className="side-nav__link"
								py={10}
							/>
						);
					})}
				</Stack>
				{isSignedIn && (
					<Button
						component={Link}
						to="/song/create"
						variant="light"
						leftSection={<IconPlus size={16} />}
						fullWidth
						mt="md"
					>
						New song
					</Button>
				)}
			</Box>
			<Box p="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
				<UserMenu variant="full" />
			</Box>
		</Stack>
	);
}

function BottomNav() {
	const { isSignedIn } = useSession();
	const { pathname } = useLocation();
	const items = NAV_ITEMS.filter((i) => !i.requiresAuth || isSignedIn);

	return (
		<nav className="bottom-nav no-print" aria-label="Main">
			{items.map((item) => {
				const active = item.isActive(pathname);
				return (
					<Link
						key={item.to}
						to={item.to}
						className="bottom-nav__item"
						data-active={active}
						aria-current={active ? 'page' : undefined}
					>
						<item.icon size={22} stroke={active ? 2.2 : 1.75} />
						<span>{item.label}</span>
					</Link>
				);
			})}
			{!isSignedIn && (
				<button type="button" className="bottom-nav__item" onClick={() => void signIn()}>
					<IconLogin size={22} stroke={1.75} />
					<span>Sign in</span>
				</button>
			)}
		</nav>
	);
}

export function AppLayout() {
	const navigation = useNavigation();
	const matches = useMatches();
	const isDesktop = useMediaQuery(DESKTOP_QUERY, true, { getInitialValueInEffect: false });

	const handles = matches.map((m) => m.handle as RouteHandle | undefined);
	const immersive = handles.some((h) => h?.immersive);
	const maxWidth = [...handles].reverse().find((h) => typeof h?.maxWidth === 'number')?.maxWidth ?? DEFAULT_MAX_WIDTH;

	useEffect(() => {
		if (navigation.state === 'loading') nprogress.start();
		else nprogress.complete();
	}, [navigation.state]);

	return (
		<AppShell
			header={{ height: 56, collapsed: isDesktop || immersive }}
			navbar={{ width: 248, breakpoint: 'md', collapsed: { mobile: true, desktop: immersive } }}
			padding={immersive ? 0 : { base: 'md', md: 'xl' }}
		>
			<a href="#main-content" className="app-skip-link">
				Skip to content
			</a>
			<NavigationProgress size={2} />
			<ScrollRestoration />

			{!isDesktop && !immersive && (
				<AppShell.Header className="no-print">
					<Group h="100%" px="md" justify="space-between" wrap="nowrap">
						<Logo size="md" />
						<UserMenu variant="compact" />
					</Group>
				</AppShell.Header>
			)}

			{isDesktop && !immersive && (
				<AppShell.Navbar className="no-print">
					<SideNav />
				</AppShell.Navbar>
			)}

			<AppShell.Main id="main-content" className={immersive ? undefined : 'app-main'}>
				{immersive ? (
					<Outlet />
				) : (
					<Box maw={maxWidth} mx="auto">
						<Outlet />
					</Box>
				)}
			</AppShell.Main>

			{!isDesktop && !immersive && <BottomNav />}
		</AppShell>
	);
}
