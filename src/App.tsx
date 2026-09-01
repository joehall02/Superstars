import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';

import { ConfigProvider } from './context/configProvider';
import { queryClient } from './queryClient';
import { router } from './router';
import { ThemeModeProvider } from './theme/themeModeProvider';

const App = () => (
	<ThemeModeProvider>
		<QueryClientProvider client={queryClient}>
			<ConfigProvider>
				<RouterProvider router={router} />
			</ConfigProvider>
		</QueryClientProvider>
	</ThemeModeProvider>
);

export default App;
