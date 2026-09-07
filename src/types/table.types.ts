import { type ReactNode } from 'react';

/** Horizontal cell alignment (subset of MUI's `TableCell` `align`). */
export type ColumnAlign = 'left' | 'right' | 'center';

/**
 * A single table column. `getValue` supplies the sort key (and the default cell
 * text); `render` overrides the cell content without affecting sorting.
 */
export interface ColumnDef<Row> {
	key: string;
	label: string;
	/** Rich header content (e.g. an icon + label); falls back to `label` when unset. */
	header?: ReactNode;
	align?: ColumnAlign;
	sortable?: boolean;
	getValue?: (row: Row) => number | string | null;
	render?: (row: Row) => ReactNode;
}
