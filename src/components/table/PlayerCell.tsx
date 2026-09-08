import { usePlayerIcon } from '../../hooks/config';
import { useCachedImage } from '../../hooks/image';
import { usePlayerCellStyles } from '../styles';

interface IPlayerCellProps {
	playerId: string;
	name: string;
}

/**
 * Player column cell: a config-driven square icon to the left of the player name.
 * Falls back to name-only when the player has no icon in config ({@link usePlayerIcon}
 * returns `undefined`) or the image fetch fails ({@link useCachedImage} returns `undefined`).
 * The image is fetched once and cached, so the profile card can reuse it without a second
 * network request. A plain `<img>` is used deliberately — MUI `Avatar` would render an
 * empty box on a missing source, whereas we want nothing but the name.
 */
export const PlayerCell = ({ playerId, name }: IPlayerCellProps) => {
	const iconUrl = useCachedImage(usePlayerIcon(playerId));
	const { classes } = usePlayerCellStyles();

	return (
		<span className={classes.cell}>
			{iconUrl && <img className={classes.icon} src={iconUrl} alt='' />}
			{name}
		</span>
	);
};
