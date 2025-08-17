import { Box } from '@mantine/core';
import { Link } from 'react-router-dom';

export const Logo = () => {
	return (
		<Box component={Link} to={'/'} style={{ all: 'unset', cursor: 'pointer' }}>
			russchords
		</Box>
	);
};
