import { CssBaseline, ThemeProvider } from '@mui/material';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { ThemeModeContext } from '../context/themeModeContext';
import { ThemeMode } from '../enums/theme';
import { getLocalStorageItem, setLocalStorageItem } from '../helpers/localstorage';
import { darkTheme, lightTheme } from './themes';

const THEME_MODE_STORAGE_KEY = 'themeMode';

const getInitialMode = (): ThemeMode => {
	const savedMode = getLocalStorageItem<ThemeMode | null>(THEME_MODE_STORAGE_KEY, null);

	if (savedMode === ThemeMode.Light || savedMode === ThemeMode.Dark) return savedMode;

	// First visit: follow the OS colour-scheme, falling back to light.
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

	return prefersDark ? ThemeMode.Dark : ThemeMode.Light;
};

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
	const [mode, setMode] = useState<ThemeMode>(getInitialMode);

	useEffect(() => {
		setLocalStorageItem(THEME_MODE_STORAGE_KEY, mode);
	}, [mode]);

	const toggleMode = useCallback(() => {
		setMode((prev) => (prev === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light));
	}, []);

	const theme = useMemo(() => (mode === ThemeMode.Light ? lightTheme : darkTheme), [mode]);

	return (
		<ThemeModeContext.Provider value={{ mode, toggleMode }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</ThemeModeContext.Provider>
	);
};
