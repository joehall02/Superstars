import GitHubIcon from '@mui/icons-material/GitHub';
import { Box, Link } from '@mui/material';

import { useFooterLocalisation } from '../hooks/config';
import { useSiteFooterStyles } from './styles';

/**
 * Site-wide footer at the base of the content panel.
 */
export const SiteFooter = () => {
	const { classes } = useSiteFooterStyles();
	const { sourceCode, sourceUrl } = useFooterLocalisation();

	return (
		<Box component='footer' className={classes.footer}>
			<Link href={sourceUrl} target='_blank' rel='noopener noreferrer' className={classes.link}>
				<GitHubIcon fontSize='small' />
				{sourceCode}
			</Link>
		</Box>
	);
};
