import { type ReactNode, useMemo } from 'react';

import { SortDirection, type StatType } from '../../enums/config';
import { buildStatLegend } from '../../helpers/legend';
import { buildLeaderboardColumns } from '../../helpers/table';
import { useConfig, useStatLabels } from '../../hooks/config';
import { usePlayers } from '../../services/masterScores/useMasterScores';
import { type LeaderboardRow } from '../../types/table.types';
import { Header } from './Header';
import { Legend } from './Legend';
import { Table } from './Table';

interface ILeaderboardTableProps {
	gameId: string;
	type: StatType;
	rows: LeaderboardRow[];
	onSelectPlayer?: (playerId: string) => void;
	isLoading?: boolean;
	ariaLabel?: string;
	headerTitle?: string;
	footer?: ReactNode;
	height?: number;
}

/**
 * Config-aware leaderboard for a single game. Resolves column labels via
 * {@link useStatLabels} and player names via {@link usePlayers}, then builds the
 * rank + player + stat columns via {@link buildLeaderboardColumns} and renders a {@link Table}.
 * Stat headers carry a decode tooltip (desktop) plus a mobile {@link Legend} in the title bar.
 */
export const LeaderboardTable = ({
	gameId,
	type,
	rows,
	onSelectPlayer,
	isLoading,
	ariaLabel = 'Leaderboard',
	headerTitle,
	footer,
	height,
}: ILeaderboardTableProps) => {
	const labels = useStatLabels(gameId, type);
	const { getStatDescription } = useConfig();
	const { data: players = {} } = usePlayers();

	const columns = useMemo(() => buildLeaderboardColumns(labels, players, getStatDescription), [labels, players, getStatDescription]);
	const legendEntries = useMemo(() => buildStatLegend(labels, getStatDescription), [labels, getStatDescription]);

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
			header={<Header title={headerTitle} legend={<Legend entries={legendEntries} />} />}
			footer={footer}
			height={height}
		/>
	);
};
