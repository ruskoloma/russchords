import { useLoaderData } from 'react-router-dom';
import type { CachedSongDto } from '../../types';
import { SongComponent } from '../../components/Viewer/Viewer.tsx';

export function CachedSongPage() {
	const song = useLoaderData() as CachedSongDto;

	return (
		<>
			<SongComponent />
		</>
	);
}
