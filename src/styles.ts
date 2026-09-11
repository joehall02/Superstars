import { alpha, type Theme } from '@mui/material';
import { type CSSObject } from 'tss-react';
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

/**
 * Framed paper surface — bordered, rounded, with overflow clipped so a full-bleed child
 * (e.g. a primary Header bar) rounds to the top corners. Spread into a component's own
 * styles file to give it the shared card treatment.
 */
export const cardSurface = (theme: Theme): CSSObject => ({
	overflow: 'hidden',
	borderRadius: theme.shape.borderRadius,
	border: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.background.paper,
});

/**
 * 4:3 framed image tile shared by the Games grid tiles and the Game Details image panel:
 * a bordered, rounded surface that crops a `cover` image and zooms it slightly on hover
 * (`overflow: hidden` crops the overflow). Pair with {@link imageTileImage} on the `<img>`
 * and {@link imageTileOverlay} for the grey wash.
 */
export const imageTile = (theme: Theme): CSSObject => ({
	position: 'relative',
	aspectRatio: '4 / 3',
	overflow: 'hidden',
	borderRadius: theme.shape.borderRadius,
	border: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.background.paper,
	'&:hover img': {
		transform: 'scale(1.05)',
	},
});

/** The `<img>` inside an {@link imageTile}: absolutely fills the tile, cropping via `cover`. */
export const imageTileImage: CSSObject = {
	position: 'absolute',
	inset: 0,
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	display: 'block',
	transition: 'transform 0.3s ease',
};

/** Grey wash over an {@link imageTile}'s image. */
export const imageTileOverlay = (theme: Theme): CSSObject => ({
	position: 'absolute',
	inset: 0,
	backgroundColor: alpha(theme.palette.common.black, 0.4),
});
