import { type SvgIconComponent } from '@mui/icons-material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import { AppBar, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { NavLink, useLocation } from 'react-router';

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
	const { classes } = useFooterStyles();
	const navLinks = useNavLinks();
	const { pathname } = useLocation();

	// Highlight the deepest link whose path prefixes the current route so nested
	// pages still light up their top-level nav entry. `false` = no selection.
	const current =
		navLinks.find((link) => pathname === link.path || pathname.startsWith(`${link.path}/`))?.path ?? false;

	return (
		<AppBar position='fixed' color='primary' className={classes.footer}>
			<BottomNavigation value={current} showLabels className={classes.nav}>
				{navLinks.map((link) => {
					const Icon = NAV_ICONS[link.icon];

					return (
						<BottomNavigationAction
							key={link.id}
							value={link.path}
							component={NavLink}
							to={link.path}
							label={link.label}
							icon={Icon ? <Icon /> : undefined}
							className={classes.navLink}
						/>
					);
				})}
			</BottomNavigation>
		</AppBar>
	);
};
