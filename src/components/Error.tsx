import { Box, Button, Container, Typography } from '@mui/material';

import { Navbar } from './Navbar';
import { useErrorStyles } from './styles';

interface IErrorDetail {
	code: string;
	message: string;
}

interface IErrorProps {
	title: string;
	message: string;
	/** Primary action label (e.g. "Try again", "Back to Rankings"). */
	actionLabel: string;
	onAction: () => void;
	/** Optional machine-readable failure details, rendered one row per entry. */
	details?: IErrorDetail[];
}

/**
 * Full-page error notice shared by the standalone Error and 404 pages — the app chrome
 * (Navbar) plus a centered card with a title, message, optional detail list, and a single
 * primary action. Sits outside the protected layout, so it carries its own frame.
 */
export const Error = ({ title, message, actionLabel, onAction, details = [] }: IErrorProps) => {
	const { classes } = useErrorStyles();

	return (
		<Box className={classes.root}>
			<Navbar />
			<Container maxWidth='sm' className={classes.container}>
				<Box className={classes.card}>
					<Typography variant='h1' className={classes.title}>{title}</Typography>
					<Typography className={classes.message}>{message}</Typography>
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
						<Button variant='contained' color='primary' className={classes.actionButton} onClick={onAction}>{actionLabel}</Button>
					</Box>
				</Box>
			</Container>
		</Box>
	);
};
