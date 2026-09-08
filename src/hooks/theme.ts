import { useMediaQuery, useTheme } from '@mui/material';
import { useContext } from 'react';

import { ThemeModeContext } from '../context/themeModeContext';
import type { ThemeModeContextValue } from '../types/theme.types';

export const useThemeMode = (): ThemeModeContextValue => {
	const context = useContext(ThemeModeContext);

	if (!context) {
		throw new Error('Must be used within a ThemeModeProvider');
	}

	return context;
};

/**
 * Boolean flags for the current screen size, so components can conditionally render
 * based on breakpoints without calling `useMediaQuery` inline.
 */
export const useScreenDetection = () => {
	const theme = useTheme();

	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const isTablet = useMediaQuery(theme.breakpoints.between('md', 1443));
	const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

	return {
		isMobile,
		isTablet,
		isDesktop,
	};
};
