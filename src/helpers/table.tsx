import { type Game, type Player } from '../../shared/types';
import { GameHeaderCell } from '../components/table/GameHeaderCell';
import { PlayerCell } from '../components/table/PlayerCell';
import { type StatLabels } from '../types/config.types';
import { type ColumnDef, type LeaderboardRow, type OverallLeaderboardRow, type RankedRow } from '../types/table.types';
import { buildStatColumns } from './tableColumns';

/**
 * The fixed leaderboard prefix shared by game and overall tables: a rank column and a
 * player column that renders a config-driven icon beside the name (see {@link PlayerCell}).
 * `getValue` drives sort-by-name and the plain-text fallback.
 */
const buildPlayerColumns = <Row extends RankedRow>(players: Record<string, Player>): ColumnDef<Row>[] => [
	{ key: 'rank', label: 'Rank', sortable: true, getValue: (row) => row.rank },
	{
		key: 'playerId',
		label: 'Player',
		sortable: true,
		getValue: (row) => players[row.playerId]?.name ?? row.playerId,
		render: (row) => <PlayerCell playerId={row.playerId} name={players[row.playerId]?.name ?? row.playerId} />,
	},
];

/**
 * Builds one rank column per game for the overall all-time standings, read from each
 * row's `gameRanks` (only present on all-time rows — `null` for other row shapes, and
 * for players who never played that game). Headers show the game icon + name via
 * {@link GameHeaderCell}; config order (from {@link getAllGames}) dictates column order.
 */
export const buildGameRankColumns = (games: Game[]): ColumnDef<OverallLeaderboardRow>[] =>
	games.map((game) => ({
		key: game.id,
		label: game.name,
		header: <GameHeaderCell gameId={game.id} name={game.name} />,
		align: 'right',
		sortable: true,
		getValue: (row) => ('gameRanks' in row ? row.gameRanks[game.id] ?? null : null),
	}));

/**
 * Builds the full leaderboard column set for a single game: the fixed rank + player
 * prefix prepended to the config-driven stat columns.
 */
export const buildLeaderboardColumns = (labels: StatLabels, players: Record<string, Player>): ColumnDef<LeaderboardRow>[] => [
	...buildPlayerColumns<LeaderboardRow>(players),
	...buildStatColumns<LeaderboardRow>(labels),
];

/**
 * Builds the column set for the overall (game-agnostic) standings: the same rank + player
 * prefix followed by the overall stat columns (`score` for all-time, `totalGameRanks` by year).
 */
export const buildOverallColumns = (labels: StatLabels, players: Record<string, Player>): ColumnDef<OverallLeaderboardRow>[] => [
	...buildPlayerColumns<OverallLeaderboardRow>(players),
	...buildStatColumns<OverallLeaderboardRow>(labels),
];
