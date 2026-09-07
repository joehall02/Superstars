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
		// Fluid header sizing: scales smoothly with the viewport 
		h1: { fontFamily: '"Big Shoulders Inline", sans-serif', fontWeight: 900, fontSize: 'clamp(3.5rem, 5vw, 5.5rem)' },
		h2: { fontFamily: '"Big Shoulders Inline", sans-serif', fontWeight: 900, fontSize: 'clamp(2.5rem, 3.5vw, 3.75rem)' },
		h3: { fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)' },
	},
	// TODO: Component-wide defaults live here. For future component/page work, the boxy
	// 3D effect can be baked into MUI components directly via `styleOverrides`
	// below (e.g. add it to `MuiPaper`/`MuiCard`/`MuiButton` roots) instead of
	// authoring a shared CSS class and hand-applying it to every element that
	// needs it — centralising it here keeps the effect consistent and in one place.
	components: {
		MuiAppBar: {
			defaultProps: {
				// Keep the palette `color` (e.g. `primary`) as the AppBar background in dark
				// mode. Without this, MUI forces dark-mode AppBars to the flat `background.paper`
				// surface colour, discarding our themed primary. Applies to every AppBar
				// (Navbar, Footer) so individual components don't repeat the prop.
				enableColorOnDark: true,
			},
		},
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
		primary: { main: '#0A5095' },
		secondary: { main: '#FFD737' },
		background: { default: '#F4EAD5', paper: '#FBF3E4' },
		text: { primary: '#3E2C1C' },
	},
});

export const darkTheme = createTheme({
	...sharedOptions,
	palette: {
		mode: 'dark',
		primary: { main: '#000000' },
		secondary: { main: '#F5DE47' },
		background: { default: '#1E1710', paper: '#2A2018' },
		text: { primary: '#F4EAD5' },
	},
});
