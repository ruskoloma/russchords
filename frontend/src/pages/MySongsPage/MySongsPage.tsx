import { useLoaderData } from 'react-router-dom';
import type { SongDto } from '../../types';

export const MySongsPage: React.FC = () => {
	const songsDto = useLoaderData<Array<SongDto>>();

	console.log('songsDto, ', songsDto);

	return <>My Songs Page</>;
};
