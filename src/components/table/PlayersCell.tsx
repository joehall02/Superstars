import { type Player } from '../../../shared/types';
import { usePlayersCellStyles } from '../styles';
import { PlayerCell } from './PlayerCell';

interface IPlayersCellProps {
	playerIds: string[];
	players: Record<string, Player>;
}

/**
 * Renders one or more players in a single cell as a vertical stack of {@link PlayerCell}s —
 * used by the year champions table where a place can be shared (ties). Falls back to an em
 * dash when no players hold the place.
 */
export const PlayersCell = ({ playerIds, players }: IPlayersCellProps) => {
	const { classes } = usePlayersCellStyles();

	if (playerIds.length === 0) {
		return <>—</>;
	}

	return (
		<span className={classes.stack}>
			{playerIds.map((playerId) => (
				<PlayerCell key={playerId} playerId={playerId} name={players[playerId]?.name ?? playerId} />
			))}
		</span>
	);
};
