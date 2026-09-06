import { useState } from 'react';

import { usePlayerIcon } from '../../hooks/config';
import { usePlayerCellStyles } from '../styles';

interface IPlayerCellProps {
	playerId: string;
	name: string;
}

/**
 * Player column cell: a config-driven square icon to the left of the player name.
 * Falls back to name-only when the player has no icon in config ({@link usePlayerIcon}
 * returns `undefined`), or when the image fails to load / isn't a valid image (`onError`).
 * A plain `<img>` is used deliberately — MUI `Avatar` would render an empty box on a
 * missing/broken source, whereas we want nothing but the name.
 */
export const PlayerCell = ({ playerId, name }: IPlayerCellProps) => {
	const iconUrl = usePlayerIcon(playerId);
	const { classes } = usePlayerCellStyles();
	const [broken, setBroken] = useState(false);

	return (
		<span className={classes.cell}>
			{iconUrl && !broken && (
				<img className={classes.icon} src={iconUrl} alt='' onError={() => setBroken(true)} />
			)}
			{name}
		</span>
	);
};
