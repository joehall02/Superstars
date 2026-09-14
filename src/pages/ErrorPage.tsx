import { Box, Button, Container, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';

import { Navbar } from '../components/Navbar';
import { Page, PageNames } from '../enums/pages';
import { usePageLocalisation } from '../hooks/config';
import { masterScoresKey } from '../services/masterScores/useMasterScores';
import { readMasterScoresError } from '../services/masterScores/useMasterScoresErrors';
import { useErrorPageStyles } from './styles';

/**
 * Shown when the master scores dataset fetch fails or returns an invalid shape — the protected
 * layout's error gate redirects here. Renders the failure's machine-readable
 * details (converter `ConversionError`s or a frontend `DataLoadError`) alongside a
 * friendly message, and a retry that clears the cached error and re-attempts the load.
 */
export const ErrorPage = () => {
	const { classes } = useErrorPageStyles();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const page = usePageLocalisation(PageNames.Error);

	const error = readMasterScoresError(queryClient);

	// Clear the cached failure so the next mount refetches, then head to Rankings. If the
	// data is still broken the gate lands us back here; if it recovers, Rankings renders.
	const handleRetry = () => {
		void queryClient.resetQueries({ queryKey: masterScoresKey });
		navigate(Page.Rankings);
	};

	// No active error — a manual refresh or direct visit to /error wipes the in-memory query
	// cache, so there's nothing to show here. Bounce to Rankings and let the gate re-evaluate:
	// if the data is still broken it redirects back here with the error populated.
	if (!error) {
		return <Navigate to={Page.Rankings} replace />;
	}

	const details = error.errors;

	return (
		<Box className={classes.root}>
			<Navbar />
			<Container maxWidth='sm' className={classes.container}>
				<Box className={classes.card}>
					<Typography variant='h1' className={classes.title}>
						{page?.title ?? 'Something went wrong'}
					</Typography>
					<Typography className={classes.message}>
						{page?.message ?? 'We couldn\'t load the Superstars data. Please try again.'}
					</Typography>
					{details.length > 0 && (
						<Box className={classes.details} role='alert'>
							{details.map((detail, index) => (
								<Box key={index} className={classes.detailRow}>
									<Typography component='code' className={classes.detailCode}>{detail.code}</Typography>
									<Typography className={classes.detailMessage}>{detail.message}</Typography>
								</Box>
							))}
						</Box>
					)}
					<Box className={classes.actions}>
						<Button variant='contained' color='primary' className={classes.retryButton} onClick={handleRetry}>Try again</Button>
					</Box>
				</Box>
			</Container>
		</Box>
	);
};
