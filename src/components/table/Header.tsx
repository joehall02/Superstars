import { Typography } from '@mui/material';
import { type ReactNode } from 'react';

import { useTableHeaderStyles } from '../styles';

interface IHeaderProps {
	title?: string;
	/** Optional action pinned to the right edge (e.g. a column-key Legend). */
	legend?: ReactNode;
}

/**
 * Full-width title bar for a {@link Table}, rendered above the column headers (see the
 * table's `header` slot). Domain-agnostic — the owner supplies the title — so it can sit
 * atop any table that wants a labelled header section.
 */
export const Header = ({ title, legend }: IHeaderProps) => {
	const { classes } = useTableHeaderStyles();

	return (
		<div className={classes.bar}>
			<Typography variant='subtitle1' className={classes.title}>{title}</Typography>
			{legend && <div className={classes.action}>{legend}</div>}
		</div>
	);
};
