import { Box, Skeleton, Table as MuiTable, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';
import { type ReactNode, useMemo, useState } from 'react';

import { SortDirection } from '../../enums/config';
import { sortRows } from '../../helpers/tableColumns';
import { type ColumnDef } from '../../types/table.types';
import { useTableStyles } from '../styles';

interface SortState {
	key: string;
	direction: SortDirection;
}

interface TableProps<Row> {
	columns: ColumnDef<Row>[];
	rows: Row[];
	getRowKey: (row: Row) => string;
	/** Makes rows clickable (e.g. for player selection). */
	onRowClick?: (row: Row) => void;
	/** Renders skeleton placeholder rows instead of data. */
	isLoading?: boolean;
	skeletonRows?: number;
	defaultSort?: SortState;
	ariaLabel?: string;
	/** Full-width title region rendered above the column headers. */
	header?: ReactNode;
	/** Full-width region rendered below the scroll containe. */
	footer?: ReactNode;
	/** Fixed container height in px; content beyond it scrolls vertically. `'auto'` sizes to content. */
	height?: number | 'auto';
}

/** Renders a cell's content: an explicit `render`, else the `getValue` (null → em dash). */
const renderCell = <Row,>(column: ColumnDef<Row>, row: Row): ReactNode => {
	if (column.render) {
		return column.render(row);
	}

	return column.getValue?.(row) ?? '—';
};

/**
 * Generic, presentational table component. Knows nothing about games, config, or
 * any particular domain: callers supply {@link ColumnDef}s and rows, so it can be
 * reused anywhere a table is needed — leaderboards, player stats, game lists, etc.
 * Sortable columns sort client-side via each column's `getValue`.
 * {@link LeaderboardTable} is one config-aware wrapper built on it.
 */
export const Table = <Row,>({
	columns,
	rows,
	getRowKey,
	onRowClick,
	isLoading,
	skeletonRows = 5,
	defaultSort,
	ariaLabel,
	header,
	footer,
	height = 400,
}: TableProps<Row>) => {
	const { classes, cx } = useTableStyles({ height });
	const [sort, setSort] = useState<SortState | undefined>(
		() => defaultSort ?? (columns[0] ? { key: columns[0].key, direction: SortDirection.Asc } : undefined),
	);

	const sortedRows = useMemo(() => {
		if (!sort) {
			return rows;
		}

		const active = columns.find((column) => column.key === sort.key);

		return active ? sortRows(rows, active, sort.direction) : rows;
	}, [rows, columns, sort]);

	const handleSort = (column: ColumnDef<Row>) => {
		if (!column.sortable) {
			return;
		}

		setSort((prev) =>
			prev?.key === column.key
				? { key: column.key, direction: prev.direction === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc }
				: { key: column.key, direction: SortDirection.Asc },
		);
	};

	return (
		<Box className={classes.root}>
			{header}
			<TableContainer className={classes.container}>
				<MuiTable size='small' aria-label={ariaLabel} className={classes.table}>
					<TableHead>
						<TableRow>
							{columns.map((column) => {
								const isActive = Boolean(sort && sort.key === column.key);
								const direction = sort && sort.key === column.key ? sort.direction : SortDirection.Asc;

								return (
									<TableCell key={column.key} align={column.align}>
										{column.sortable ? (
											<TableSortLabel active={isActive} direction={direction} onClick={() => handleSort(column)}>
												{column.header ?? column.label}
											</TableSortLabel>
										) : (
											column.header ?? column.label
										)}
									</TableCell>
								);
							})}
						</TableRow>
					</TableHead>
					<TableBody>
						{isLoading
							? Array.from({ length: skeletonRows }, (_, rowIndex) => (
								<TableRow key={rowIndex} className={classes.bodyRow}>
									{columns.map((column) => (
										<TableCell key={column.key} align={column.align}>
											<Skeleton />
										</TableCell>
									))}
								</TableRow>
							))
							: sortedRows.map((row) => (
								<TableRow
									key={getRowKey(row)}
									hover={Boolean(onRowClick)}
									onClick={onRowClick ? () => onRowClick(row) : undefined}
									className={cx(classes.bodyRow, onRowClick && classes.clickableRow)}
								>
									{columns.map((column) => (
										<TableCell key={column.key} align={column.align}>
											{renderCell(column, row)}
										</TableCell>
									))}
								</TableRow>
							))}
					</TableBody>
				</MuiTable>
			</TableContainer>
			{footer && <Box className={classes.footer}>{footer}</Box>}
		</Box>
	);
};
