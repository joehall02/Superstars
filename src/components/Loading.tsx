import { Box, CircularProgress } from '@mui/material';

import { ThemeMode } from '../enums/theme';
import { useThemeMode } from '../hooks/theme';
import { useStyles } from '../styles';

export const Loading = () => {
	const { classes } = useStyles();
	const { mode } = useThemeMode();

	return (
		<Box className={classes.centered}>
			<CircularProgress color={mode === ThemeMode.Dark ? 'secondary' : 'primary'} />
		</Box>
	);
};
