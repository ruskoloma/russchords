import { Center, Stack, Progress, Title } from '@mantine/core';
import React from 'react';

export const MrBeanLoader: React.FC<{ durationSec?: number }> = ({ durationSec = 5 }) => {
	const num = React.useMemo(() => Math.floor(Math.random() * 3) + 1, []);
	const src = `/loaders/${num}.gif`;
	const [value, setValue] = React.useState(durationSec <= 0 ? 100 : 0);

	React.useEffect(() => {
		if (durationSec <= 0) return;
		const step = 100 / durationSec;
		const id = setInterval(() => {
			setValue((v) => {
				const next = v + step;
				return next >= 100 ? 100 : next;
			});
		}, 1000);
		return () => clearInterval(id);
	}, [durationSec]);

	return (
		<Center mt={'4rem'}>
			<Stack align="center">
				<img src={src} alt="Loading..." />
				<Progress value={value} w={320} mt="md" color="cyan" />
				<Title order={3}>Loading...</Title>
			</Stack>
		</Center>
	);
};
