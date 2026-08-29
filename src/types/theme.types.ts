import type { ThemeMode } from '../enums/theme';

export type ThemeModeContextValue = { mode: ThemeMode; toggleMode: () => void };
