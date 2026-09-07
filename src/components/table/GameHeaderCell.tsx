import { useGameAbbreviation, useGameIcon } from '../../hooks/config';
import { useGameHeaderCellStyles } from '../styles';

interface IGameHeaderCellProps {
	gameId: string;
	name: string;
}

/**
 * Column header for a per-game rank column: the game's config-driven icon, with the
 * game abbreviation (e.g. "AIR") beside it on desktop and hidden below `md` (icon only
 * on mobile). Falls back to the full name when no abbreviation is configured. The icon's
 * `alt` carries the full game name so the header stays labelled when the text is hidden
 * or the icon is missing.
 */
export const GameHeaderCell = ({ gameId, name }: IGameHeaderCellProps) => {
	const iconUrl = useGameIcon(gameId);
	const abbreviation = useGameAbbreviation(gameId) ?? name;
	const { classes } = useGameHeaderCellStyles();

	return (
		<span className={classes.cell}>
			{iconUrl && <img className={classes.icon} src={iconUrl} alt={name} />}
			<span className={classes.abbreviation}>{abbreviation}</span>
		</span>
	);
};
