import { createContext } from 'react';

import type { ThemeModeContextValue } from '../types/theme.types';

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);
