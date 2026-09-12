import { Box, Typography } from '@mui/material';

import { usePageHeaderStyles } from './styles';

interface IPageHeaderProps {
	/** The page's localised title (from `usePageLocalisation(...).title`). */
	title?: string;
	/** Optional config-driven icon (e.g. a game icon) rendered before the title. */
	iconUrl?: string;
}

/** The underlined `h1` page title, shared across pages, optionally icon-prefixed. */
export const PageHeader = ({ title, iconUrl }: IPageHeaderProps) => {
	const { classes } = usePageHeaderStyles({ iconUrl });

	return (
		<Box className={classes.root}>
			{iconUrl && <Box component='span' className={classes.icon} />}
			<Typography variant='h1' className={classes.title}>{title}</Typography>
		</Box>
	);
};
