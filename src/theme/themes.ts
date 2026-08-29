import { createTheme, type ThemeOptions } from '@mui/material';

/** Shared, mode-agnostic theme configuration. */
const sharedOptions: ThemeOptions = {
	typography: {
		fontFamily: [
			'-apple-system',
			'BlinkMacSystemFont',
			'"Segoe UI"',
			'Roboto',
			'"Helvetica Neue"',
			'Arial',
			'sans-serif',
		].join(', '),
	},
	// TODO: Component-wide defaults live here. For future component/page work, the boxy
	// 3D effect can be baked into MUI components directly via `styleOverrides`
	// below (e.g. add it to `MuiPaper`/`MuiCard`/`MuiButton` roots) instead of
	// authoring a shared CSS class and hand-applying it to every element that
	// needs it — centralising it here keeps the effect consistent and in one place.
	components: {
		MuiButton: {
			defaultProps: {
				disableElevation: true,
			},
			styleOverrides: {
				root: {
					textTransform: 'none',
				},
			},
		},
	},
};

export const lightTheme = createTheme({
	...sharedOptions,
	palette: {
		mode: 'light',
		primary: { main: '#D2691E' },
		secondary: { main: '#2A9D8F' },
		background: { default: '#F4EAD5', paper: '#FBF3E4' },
		text: { primary: '#3E2C1C' },
	},
});

export const darkTheme = createTheme({
	...sharedOptions,
	palette: {
		mode: 'dark',
		primary: { main: '#E0A458' },
		secondary: { main: '#4DB6A5' },
		background: { default: '#1E1710', paper: '#2A2018' },
		text: { primary: '#F4EAD5' },
	},
});
