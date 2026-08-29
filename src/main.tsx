import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { queryClient } from './queryClient.ts';
import { ThemeModeProvider } from './theme/themeModeProvider.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeModeProvider>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</ThemeModeProvider>
	</StrictMode>,
);
