import { makeStyles } from 'tss-react/mui';

/** Component-local styles for `src/components/`. */
export const useStyles = makeStyles()(() => ({}));

export const useLogoStyles = makeStyles()(() => ({
	svg: {
		display: 'block',
		width: 150,
		height: 100,
	},
}));
