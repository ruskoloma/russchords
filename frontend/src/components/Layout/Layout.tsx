import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell, Box, Burger, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Logo } from './Logo.tsx';
import { IconHome2 } from '@tabler/icons-react';

export const Layout: React.FC = () => {
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
				<NavLink label="Home" leftSection={<IconHome2 size={16} stroke={1.5} />} />
			</AppShell.Navbar>

			<AppShell.Main>
				<Box maw={'750px'} m={'0 auto'}>
					<Outlet />
				</Box>
			</AppShell.Main>
		</AppShell>
	);
};
