import { Box, Button, Container, Typography } from '@mui/material';
import { useRouteError } from 'react-router';

import { useErrorStyles } from './styles';

/**
 * Root route `ErrorBoundary` — rendered in place of the outlet when any route throws. Deliberately
 * config- and Navbar-free (the crash may be in either, and a boundary that throws can't be caught):
 * leans only on the theme and offers a reload.
 */
export const RouteErrorBoundary = () => {
	const { classes } = useErrorStyles();
	const error = useRouteError();

	console.error('Uncaught error in route tree:', error);

	return (
		<Box className={classes.root}>
			<Container maxWidth='sm' className={classes.container}>
				<Box className={classes.card}>
					<Typography variant='h1' className={classes.title}>Something went wrong</Typography>
					<Typography className={classes.message}>The app hit an unexpected error.</Typography>
					<Box className={classes.actions}>
						<Button variant='contained' color='primary' className={classes.actionButton} onClick={() => window.location.reload()}>
							Reload
						</Button>
					</Box>
				</Box>
			</Container>
		</Box>
	);
};
