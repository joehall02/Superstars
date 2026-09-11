import { type ReactNode, useMemo } from 'react';

import { SortDirection, type StatType } from '../../enums/config';
import { buildLeaderboardColumns } from '../../helpers/table';
import { useStatLabels } from '../../hooks/config';
import { usePlayers } from '../../services/masterScores/useMasterScores';
import { type LeaderboardRow } from '../../types/table.types';
import { Table } from './Table';

interface ILeaderboardTableProps {
	gameId: string;
	type: StatType;
	rows: LeaderboardRow[];
	onSelectPlayer?: (playerId: string) => void;
	isLoading?: boolean;
	ariaLabel?: string;
	header?: ReactNode;
	footer?: ReactNode;
	height?: number;
}

/**
 * Config-aware leaderboard for a single game. Resolves column labels via
 * {@link useStatLabels} and player names via {@link usePlayers}, then builds the
 * rank + player + stat columns via {@link buildLeaderboardColumns} and renders a {@link Table}.
 */
export const LeaderboardTable = ({
	gameId,
	type,
	rows,
	onSelectPlayer,
	isLoading,
	ariaLabel = 'Leaderboard',
	header,
	footer,
	height,
}: ILeaderboardTableProps) => {
	const labels = useStatLabels(gameId, type);
	const { data: players = {} } = usePlayers();

	const columns = useMemo(() => buildLeaderboardColumns(labels, players), [labels, players]);

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
