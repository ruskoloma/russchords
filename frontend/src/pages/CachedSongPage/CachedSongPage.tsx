import { useLoaderData } from 'react-router-dom';
import type { CachedSongDto } from '../../types';
import { Viewer } from '../../components/Viewer/Viewer.tsx';
import { Divider, Menu } from '@mantine/core';
import { CardHC } from '../../components/CardHC/CardHC.tsx';

export function CachedSongPage() {
	const songDto = useLoaderData<CachedSongDto>();

	return (
		<>
			<Viewer musicText={songDto.content} menuItems={[<Menu.Item>Fork</Menu.Item>]} />
			<Divider />
			<CardHC url={songDto.original_url} name={songDto.name} artist={songDto.artist} />
		</>
	);
}
