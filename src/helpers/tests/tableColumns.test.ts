import { SortDirection } from '../../enums/config';
import { type StatLabels } from '../../types/config.types';
import { type ColumnDef } from '../../types/table.types';
import { buildStatColumns, getStat, sortRows } from '../tableColumns';

describe('getStat', () => {
	test('reads a flat stat field', () => {
		expect(getStat({ played: 7, wins: 6 }, 'wins')).toBe(6);
	});

	test('returns null for a missing field', () => {
		expect(getStat({ played: 7 }, 'wins')).toBeNull();
	});

	test('returns null for an explicit null (e.g. unplayed game rank)', () => {
		expect(getStat({ g_1: null }, 'g_1')).toBeNull();
	});
});

describe('buildStatColumns', () => {
	const labels: StatLabels = { played: 'Played', wins: 'Wins', goalDifference: 'GD' };

	test('preserves config entry order', () => {
		expect(buildStatColumns(labels).map((column) => column.key)).toEqual(['played', 'wins', 'goalDifference']);
	});

	test('carries the label through and marks columns numeric/sortable', () => {
		const [played] = buildStatColumns(labels);

		expect(played.label).toBe('Played');
		expect(played.align).toBe('right');
		expect(played.sortable).toBe(true);
	});

	test('reads the matching stat via getValue', () => {
		const [, wins] = buildStatColumns<{ wins: number }>(labels);

		expect(wins.getValue?.({ wins: 9 })).toBe(9);
	});
});

describe('sortRows', () => {
	interface Row {
		playerId: string;
		wins: number | null;
	}

	const column: ColumnDef<Row> = { key: 'wins', label: 'Wins', getValue: (row) => row.wins };
	const rows: Row[] = [
		{ playerId: 'a', wins: 3 },
		{ playerId: 'b', wins: 9 },
		{ playerId: 'c', wins: 1 },
	];

	test('sorts ascending by numeric value', () => {
		expect(sortRows(rows, column, SortDirection.Asc).map((row) => row.playerId)).toEqual(['c', 'a', 'b']);
	});

	test('sorts descending by numeric value', () => {
		expect(sortRows(rows, column, SortDirection.Desc).map((row) => row.playerId)).toEqual(['b', 'a', 'c']);
	});

	test('sorts null values last regardless of direction', () => {
		const withNull: Row[] = [...rows, { playerId: 'd', wins: null }];

		expect(sortRows(withNull, column, SortDirection.Asc).at(-1)?.playerId).toBe('d');
		expect(sortRows(withNull, column, SortDirection.Desc).at(-1)?.playerId).toBe('d');
	});

	test('sorts strings via localeCompare', () => {
		const nameColumn: ColumnDef<Row> = { key: 'playerId', label: 'Player', getValue: (row) => row.playerId };

		expect(sortRows(rows, nameColumn, SortDirection.Desc).map((row) => row.playerId)).toEqual(['c', 'b', 'a']);
	});

	test('does not mutate the input array', () => {
		const input = [...rows];
		sortRows(input, column, SortDirection.Desc);

		expect(input.map((row) => row.playerId)).toEqual(['a', 'b', 'c']);
	});

	test('leaves rows untouched when the column has no getValue', () => {
		const renderOnly: ColumnDef<Row> = { key: 'x', label: 'X' };

		expect(sortRows(rows, renderOnly, SortDirection.Asc)).toEqual(rows);
	});
});
