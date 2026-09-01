import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { AppBar, Box, Divider, IconButton, Toolbar } from '@mui/material';
import { Fragment } from 'react';
import { NavLink } from 'react-router';

import { Page } from '../enums/pages';
import { ThemeMode } from '../enums/theme';
import { useNavLinks } from '../hooks/config';
import { useThemeMode } from '../hooks/theme';
import { Logo } from './Logo';
import { useNavbarStyles } from './styles';

export const Navbar = () => {
	const { classes, cx } = useNavbarStyles();
	const navLinks = useNavLinks();
	const { mode, toggleMode } = useThemeMode();

	return (
		<AppBar position='sticky' color='primary' enableColorOnDark>
			<Toolbar>
				<Box className={classes.side}>
					<NavLink to={Page.Rankings} className={classes.logoLink}>
						<Logo height={32} />
					</NavLink>
				</Box>

				<Box className={classes.linksContainer}>
					{navLinks.map((link, index) => (
						<Fragment key={link.id}>
							{index > 0 && <Divider orientation='vertical' flexItem className={classes.divider} />}
							<NavLink
								to={link.path}
								data-label={link.label}
								className={({ isActive }) => cx(classes.navLink, isActive && classes.navLinkActive)}
							>
								{link.label}
							</NavLink>
						</Fragment>
					))}
				</Box>

				<Box className={cx(classes.side, classes.sideEnd)}>
					<IconButton onClick={toggleMode} color='inherit' aria-label='toggle dark mode'>
						{mode === ThemeMode.Dark ? <Brightness7Icon /> : <Brightness4Icon />}
					</IconButton>
				</Box>
			</Toolbar>
		</AppBar>
	);
};
