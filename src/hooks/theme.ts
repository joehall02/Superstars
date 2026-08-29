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
