import { type SvgIconComponent } from '@mui/icons-material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import { AppBar, Toolbar } from '@mui/material';
import { NavLink } from 'react-router';

import { useNavLinks } from '../hooks/config';
import { useFooterStyles } from './styles';

/** Maps a config `icon` name (`layout.json`) to its MUI icon component. */
const NAV_ICONS: Record<string, SvgIconComponent> = {
	leaderboard: LeaderboardIcon,
	sports_score: SportsScoreIcon,
};

/**
 * Mobile-only bottom navigation. Renders the same config-driven links as the
 * {@link Navbar} as stacked icon + label, and is hidden from `md` up where the
 * Navbar's centre links take over.
 */
export const Footer = () => {
	const { classes, cx } = useFooterStyles();
	const navLinks = useNavLinks();

	return (
		<AppBar position='fixed' color='primary' className={classes.footer}>
			<Toolbar className={classes.toolbar}>
				{navLinks.map((link) => {
					const Icon = NAV_ICONS[link.icon];

					return (
						<NavLink
							key={link.id}
							to={link.path}
							className={({ isActive }) => cx(classes.navLink, isActive && classes.navLinkActive)}
						>
							{Icon && <Icon className={classes.icon} />}
							<span className={classes.label}>{link.label}</span>
						</NavLink>
					);
				})}
			</Toolbar>
		</AppBar>
	);
};
