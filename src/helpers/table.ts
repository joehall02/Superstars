import { type GameAllTimeRanking, type GameYearRanking, type Player } from '../../shared/types';
import { type StatLabels } from '../types/config.types';
import { type ColumnDef } from '../types/table.types';
import { buildStatColumns } from './tableColumns';

export type LeaderboardRow = GameAllTimeRanking | GameYearRanking;

/**
 * Builds the full leaderboard column set for a single game: fixed rank + player
 * columns prepended to the config-driven stat columns. Player names are resolved
 * from the players map, falling back to the raw id when missing.
 */
export const buildLeaderboardColumns = (labels: StatLabels, players: Record<string, Player>): ColumnDef<LeaderboardRow>[] => [
	{ key: 'rank', label: 'Rank', sortable: true, getValue: (row) => row.rank },
	{ key: 'playerId', label: 'Player', sortable: true, getValue: (row) => players[row.playerId]?.name ?? row.playerId },
	...buildStatColumns<LeaderboardRow>(labels),
];
