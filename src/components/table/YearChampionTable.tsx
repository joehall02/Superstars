import { type ReactNode, useMemo } from 'react';

import { type YearChampion } from '../../../shared/types';
import { SortDirection } from '../../enums/config';
import { buildYearChampionColumns } from '../../helpers/table';
import { usePlayers } from '../../services/masterScores/useMasterScores';
import { Table } from './Table';

interface IYearChampionTableProps {
	champions: YearChampion[];
	isLoading?: boolean;
	ariaLabel?: string;
	header?: ReactNode;
	footer?: ReactNode;
	height?: number;
}

/**
 * The all-years champions podium table: one row per year showing its 1st/2nd/3rd podium
 * (see {@link buildYearChampionColumns}), newest year first. Resolves player names via
 * {@link usePlayers} and renders the shared {@link Table}.
 */
export const YearChampionTable = ({ champions, isLoading, ariaLabel, header, footer, height }: IYearChampionTableProps) => {
	const { data: players = {} } = usePlayers();

	const columns = useMemo(() => buildYearChampionColumns(players), [players]);

	return (
		<Table
			columns={columns}
			rows={champions}
			getRowKey={(row) => String(row.year)}
			isLoading={isLoading}
			skeletonRows={8}
			defaultSort={{ key: 'year', direction: SortDirection.Desc }}
			ariaLabel={ariaLabel}
			header={header}
			footer={footer}
			height={height}
		/>
	);
};
