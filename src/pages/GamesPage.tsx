import { Typography } from '@mui/material';
import { Link } from 'react-router';

import { Page, PageNames } from '../enums/pages';
import { usePageLocalisation } from '../hooks/config';

export const GamesPage = () => {
	const page = usePageLocalisation(PageNames.Games);

	return (
		<main>
			<Typography variant='h1'>{page?.title}</Typography>
			<Link to={Page.Rankings}>Back to rankings</Link>
		</main>
	);
};
