import { Box, CircularProgress } from '@mui/material';

import { useStyles } from '../styles';

export const Loading = () => {
	const { classes } = useStyles();

	return (
		<Box className={classes.centered}>
			<CircularProgress />
		</Box>
	);
};
