import { type ReactNode, useMemo } from 'react';

import { SortDirection, StatType } from '../../enums/config';
import { buildGameRankColumns, buildOverallColumns } from '../../helpers/table';
import { useOverallStatLabels } from '../../hooks/config';
import { useAllGames, usePlayers } from '../../services/masterScores/useMasterScores';
import { type OverallLeaderboardRow } from '../../types/table.types';
import { Table } from './Table';

interface IOverallLeaderboardTableProps {
	type: StatType;
	rows: OverallLeaderboardRow[];
	onSelectPlayer?: (playerId: string) => void;
	isLoading?: boolean;
	ariaLabel?: string;
	header?: ReactNode;
	footer?: ReactNode;
	height?: number;
}

/**
 * Config-aware leaderboard for the overall (game-agnostic) standings. Resolves column
 * labels via {@link useOverallStatLabels} and player names via {@link usePlayers}, then builds
 * the rank + player + stat columns via {@link buildOverallColumns} and renders a {@link Table}.
 * For all-time standings it also appends a per-game rank column per game (see
 * {@link buildGameRankColumns}). Serves both all-time (`score`) and per-year
 * (`totalGameRanks`) standings via {@link StatType}.
 */
export const OverallLeaderboardTable = ({ type, rows, onSelectPlayer, isLoading, ariaLabel, header, footer, height }: IOverallLeaderboardTableProps) => {
	const labels = useOverallStatLabels(type);
	const { data: players = {} } = usePlayers();
	const { data: games = [] } = useAllGames();

	const columns = useMemo(
		() => [
			...buildOverallColumns(labels, players),
			...(type === StatType.AllTime ? buildGameRankColumns(games) : []),
		],
		[labels, players, games, type],
	);

	return (
		<Table
			columns={columns}
			rows={rows}
			getRowKey={(row) => row.playerId}
			onRowClick={onSelectPlayer ? (row) => onSelectPlayer(row.playerId) : undefined}
			isLoading={isLoading}
			skeletonRows={15}
			defaultSort={{ key: 'rank', direction: SortDirection.Asc }}
			ariaLabel={ariaLabel}
			header={header}
			footer={footer}
			height={height}
		/>
	);
};
