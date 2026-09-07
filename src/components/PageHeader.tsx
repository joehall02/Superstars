import { Typography } from '@mui/material';

import { usePageHeaderStyles } from './styles';

interface IPageHeaderProps {
	/** The page's localised title (from `usePageLocalisation(...).title`). */
	title?: string;
}

/** The underlined `h1` page title, shared across pages. */
export const PageHeader = ({ title }: IPageHeaderProps) => {
	const { classes } = usePageHeaderStyles();

	return (
		<Typography variant='h1' className={classes.title}>{title}</Typography>
	);
};
