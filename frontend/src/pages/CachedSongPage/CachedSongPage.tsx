import { useLoaderData } from 'react-router-dom';
import type { CachedSongDto } from '../../types';
import { Viewer } from '../../components/Viewer/Viewer.tsx';

export function CachedSongPage() {
	const songDto = useLoaderData<CachedSongDto>();

	return (
		<>
			<Viewer musicText={songDto.content} />
		</>
	);
}
