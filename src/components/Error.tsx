import { Box, Typography } from '@mui/material';

import { useStyles } from '../styles';

export const Error = ({ message }: { message: string }) => {
	const { classes } = useStyles();

	return (
		<Box className={classes.centered}>
			<Typography role='alert'>{message}</Typography>
		</Box>
	);
};
