import { Skeleton, Typography } from '@mui/material';
import { type KeyboardEvent } from 'react';

import { useGameImage } from '../hooks/config';
import { useCachedImage } from '../hooks/image';
import { useGameBoxStyles } from './styles';

interface IGameBoxProps {
	gameId: string;
	name: string;
	onClick?: () => void;
	isLoading?: boolean;
}

/**
 * Clickable game tile: the game image under a grey overlay with the name across the top.
 * The image shares its cached blob with other consumers via {@link useCachedImage}, and a
 * plain `<img>` shows nothing (rather than an empty box) when the game has no image or the
 * fetch fails. Presentational — the parent owns navigation via `onClick`.
 */
export const GameBox = ({ gameId, name, onClick, isLoading }: IGameBoxProps) => {
	const { classes } = useGameBoxStyles();
	const imageUrl = useCachedImage(useGameImage(gameId));

	if (isLoading) {
		return <Skeleton variant='rectangular' className={classes.skeleton} />;
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onClick?.();
		}
	};

	return (
		<div className={classes.card} role='button' tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}>
			{imageUrl && <img className={classes.image} src={imageUrl} alt='' />}
			<div className={classes.overlay} />
			<Typography variant='h5' className={classes.name}>{name}</Typography>
		</div>
	);
};
