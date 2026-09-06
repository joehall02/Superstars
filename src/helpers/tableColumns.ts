import { SortDirection } from '../enums/config';
import { type StatLabels } from '../types/config.types';
import { type ColumnDef } from '../types/table.types';

/**
 * Reads a stat off a flat ranking row. Rows are discriminated unions
 * ({@link HeadToHeadStats} | {@link AveragePointsStats} | …) with stats living
 * directly on the object, so we index through a `Record` view; a missing or
 * unplayed stat reads as `null`.
 */
export const getStat = (row: unknown, key: string): number | null =>
	(row as Record<string, number | null>)[key] ?? null;

/**
 * Builds numeric, sortable, right-aligned columns from config {@link StatLabels}.
 * Entry order is preserved, so the config file dictates column order.
 */
export const buildStatColumns = <Row>(labels: StatLabels): ColumnDef<Row>[] =>
	Object.entries(labels).map(([key, label]): ColumnDef<Row> => ({
		key,
		label,
		align: 'right',
		sortable: true,
		getValue: (row: Row) => getStat(row, key),
	}));

/**
 * Stable sort by a column's `getValue`. `null`/missing values always sort last,
 * regardless of direction. Numbers compare numerically, strings via `localeCompare`.
 * Returns a new array; the input is left untouched. Columns without `getValue`
 * (custom-`render` only) are returned in their original order.
 */
export const sortRows = <Row>(rows: Row[], column: ColumnDef<Row>, direction: SortDirection): Row[] => {
	const { getValue } = column;

	if (!getValue) {
		return [...rows];
	}

	const factor = direction === SortDirection.Asc ? 1 : -1;

	return [...rows].sort((a, b) => {
		const aValue = getValue(a);
		const bValue = getValue(b);

		if (aValue === null && bValue === null) {
			return 0;
		}
		if (aValue === null) {
			return 1;
		}
		if (bValue === null) {
			return -1;
		}

		if (typeof aValue === 'number' && typeof bValue === 'number') {
			return (aValue - bValue) * factor;
		}

		return String(aValue).localeCompare(String(bValue)) * factor;
	});
};
