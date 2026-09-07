// Honour the saved theme mode (mirrors getInitialMode in themeModeProvider.tsx) so
// the loader in loader.css matches the app the user will see. Falls back to the OS
// colour-scheme handled by loader.css's media query when nothing is stored.
(() => {
	try {
		const mode = localStorage.getItem('themeMode');
		if (mode !== 'light' && mode !== 'dark') return;
		const root = document.documentElement;
		root.style.setProperty('--app-loader-bg', mode === 'dark' ? '#1e1710' : '#f4ead5');
		root.style.setProperty('--app-loader-fg', mode === 'dark' ? '#f5de47' : '#0a5095');
	} catch (e) {}
})();
