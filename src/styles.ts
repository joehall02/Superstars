import { makeStyles } from 'tss-react/mui';

/** App-level shared styles reused across components. */
export const useStyles = makeStyles()(() => ({
	centered: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: '100vh',
	},
}));
