import { type ReactNode } from 'react';

import { type GameAllTimeRanking, type GameYearRanking, type OverallAllTimeRanking, type OverallYearRanking } from '../../shared/types';

/** Horizontal cell alignment (subset of MUI's `TableCell` `align`). */
export type ColumnAlign = 'left' | 'right' | 'center';

/** A per-game leaderboard row: all-time or per-year game stats. */
export type LeaderboardRow = GameAllTimeRanking | GameYearRanking;

/** An overall (game-agnostic) standings row: all-time or per-year. */
export type OverallLeaderboardRow = OverallAllTimeRanking | OverallYearRanking;

/** Any ranking row — every one carries a `rank` and a `playerId`. */
export type RankedRow = LeaderboardRow | OverallLeaderboardRow;

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
