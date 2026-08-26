import * as XLSX from 'xlsx';

import { GAME_DEFINITIONS, OVERALL_SHEET, PLAYER_FIRST_ROW, SOURCE_FILE_NAME } from './consts';
import { convertMasterScoresToJson } from './convertMasterScores';
import { ConversionErrorCode, GameName } from './enums';
import { type ConversionErrors, type ConversionResult, isConversionErrors, type SuperstarsData } from './types';

// ---------------------------------------------------------------------------
// Fixture builder
//
// Builds a miniature Master Scores workbook with the real sheet names and
// column layout: players in A7+, year blocks starting at D/O/Z/AK/AV/BG/BR/…
// (offsets: +0 played, +1 wins, +3 first score col, +4 second score col,
// +7 the sheet's computed rank), the all-time "Running Totals" block in
// GO/GP/GR/GS/GT/GV, and an Overall sheet (GE..GL, KY../LO..).
//
// The converter mirrors the sheet verbatim, so the fixture supplies the
// computed rank/score cells exactly as a real workbook would.
//
// Players: Alice (row 7 → p_1), Bob (row 8 → p_2), Cara (row 9 → p_3).
// ---------------------------------------------------------------------------

const GAME_SHEET_NAMES = Object.values(GameName);
const ALL_SHEET_NAMES = [...GAME_SHEET_NAMES, OVERALL_SHEET];
const PLAYERS = ['Alice', 'Bob', 'Cara'];

type SheetCells = Record<string, string | number>;

const makeSheet = (cells: SheetCells): XLSX.WorkSheet => {
	const sheet: XLSX.WorkSheet = { '!ref': 'A1:LY23' };
	for (const [address, value] of Object.entries(cells)) {
		sheet[address] = typeof value === 'number' ? { t: 'n', v: value } : { t: 's', v: value };
	}
	return sheet;
};

const playerNameCells = (): SheetCells =>
	Object.fromEntries(PLAYERS.map((name, i) => [`A${PLAYER_FIRST_ROW + i}`, name]));

interface FixtureOptions {
	/** Sheets to leave out of the workbook entirely. */
	skipSheets?: string[];
	/** Per-sheet cell overrides applied after the default data. */
	overrides?: Record<string, SheetCells>;
	/** When true, no player names are written to any sheet. */
	noPlayers?: boolean;
}

const buildFixtureBuffer = (options: FixtureOptions = {}): Buffer => {
	const data: Record<string, SheetCells> = {
		// 2020 block starts at D: D=played, E=wins, G=goals for, H=goals against,
		// K=the sheet's computed rank. GO..GV is the all-time block.
		[GameName.AirHockey]: {
			D7: 2, E7: 2, G7: 6, H7: 2, K7: '1st',
			D8: 2, E8: 1, G8: 4, H8: 4, K8: '2nd',
			D9: 2, E9: 0, G9: 2, H9: 6, K9: '3rd',
			GO7: 2, GP7: 2, GR7: 6, GS7: 2, GT7: 4, GV7: '1st',
			GO8: 2, GP8: 1, GR8: 4, GS8: 4, GT8: 0, GV8: '2nd',
			GO9: 2, GP9: 0, GR9: 2, GS9: 6, GT9: -4, GV9: '3rd',
		},
		// Alice and Bob share identical records → the sheet shows a joint 1st.
		[GameName.BarFooty]: {
			D7: 2, E7: 1, G7: 4, H7: 2, K7: '1st',
			D8: 2, E8: 1, G8: 4, H8: 2, K8: '1st',
			D9: 2, E9: 0, G9: 2, H9: 6, K9: '3rd',
			GO7: 2, GP7: 1, GR7: 4, GS7: 2, GT7: 2, GV7: '1st',
			GO8: 2, GP8: 1, GR8: 4, GS8: 2, GT8: 2, GV8: '1st',
			GO9: 2, GP9: 0, GR9: 2, GS9: 6, GT9: -4, GV9: '3rd',
		},
		// 2020 uses the legacy layout (points in the H column); the 2024 block
		// (starting AV, rank in BC) uses the modern layout. The sheet's all-time
		// block only counts 2024 onwards, so Cara (2020 only) has no all-time row.
		[GameName.Bowls]: {
			D7: 2, E7: 2, H7: 5, K7: '1st',
			D8: 2, E8: 1, H8: 5, K8: '2nd',
			D9: 2, E9: 1, H9: 2.5, K9: '3rd',
			AV7: 2, AW7: 2, AY7: 6, AZ7: 2, BC7: '1st',
			AV8: 2, AW8: 1, AY8: 4, AZ8: 4, BC8: '2nd',
			GO7: 2, GP7: 2, GR7: 6, GS7: 2, GT7: 4, GV7: '1st',
			GO8: 2, GP8: 1, GR8: 4, GS8: 4, GT8: 0, GV8: '2nd',
		},
		// 2025 block starts at BG (rank in BN). The sheet ranks Bob 1st on average
		// despite fewer total pins — the converter must not "correct" that.
		[GameName.TenPin]: {
			BG7: 4, BJ7: 40, BN7: '2nd',
			BG8: 2, BJ8: 24, BN8: '1st',
			GO7: 4, GR7: 10, GV7: '2nd',
			GO8: 2, GR8: 12, GV8: '1st',
		},
		// Bob and Cara share the same average → joint 2nd in the sheet.
		[GameName.Darts]: {
			D7: 4, G7: 100, K7: '1st',
			D8: 4, G8: 90, K8: '2nd',
			D9: 4, G9: 90, K9: '2nd',
			GO7: 4, GR7: 25, GV7: '1st',
			GO8: 4, GR8: 22.5, GV8: '2nd',
			GO9: 4, GR9: 22.5, GV9: '2nd',
		},
		// Alice and Bob tie on points → joint 1st, Cara 3rd.
		[GameName.Cards]: {
			D7: 1, G7: 60, K7: '1st',
			D8: 1, G8: 60, K8: '1st',
			D9: 1, G9: 50, K9: '3rd',
			GO7: 1, GR7: 60, GV7: '1st',
			GO8: 1, GR8: 60, GV8: '1st',
			GO9: 1, GR9: 50, GV9: '3rd',
		},
		// GE..GJ = per-game all-time ranks (blank where never played), GK = score,
		// GL = numeric rank. KY/LC/LD = 2020/2024/2025 season totals ("A" marks an
		// absent player), LO/LS/LT = the matching numeric season ranks.
		[OVERALL_SHEET]: {
			GE7: 1, GF7: 1, GG7: 1, GH7: 2, GI7: 1, GJ7: 1, GK7: 993, GL7: 1,
			GE8: 2, GF8: 1, GG8: 2, GH8: 1, GI8: 2, GJ8: 1, GK8: 991, GL8: 2,
			GE9: 3, GF9: 3, GI9: 2, GJ9: 3, GK9: 989, GL9: 3,
			KY7: 5, KY8: 8, KY9: 14, LO7: 1, LO8: 2, LO9: 3,
			LC7: 1, LC8: 2, LC9: 'A', LS7: 1, LS8: 2,
			LD7: 2, LD8: 1, LT7: 2, LT8: 1,
		},
	};

	const workbook = XLSX.utils.book_new();
	for (const sheetName of ALL_SHEET_NAMES) {
		if (options.skipSheets?.includes(sheetName)) continue;
		const cells: SheetCells = {
			...(options.noPlayers ? {} : playerNameCells()),
			...data[sheetName],
			...(options.overrides?.[sheetName] ?? {}),
		};
		XLSX.utils.book_append_sheet(workbook, makeSheet(cells), sheetName);
	}
	return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};

const convertFixture = (options: FixtureOptions = {}): SuperstarsData => {
	const result = convertMasterScoresToJson(buildFixtureBuffer(options));
	if (isConversionErrors(result)) {
		throw new Error(`Expected data, got errors: ${JSON.stringify(result.errors)}`);
	}
	return result;
};

// Narrows a result to ConversionErrors, failing the test if it returned data.
// Lets error-scenario tests assert on `.errors` without a type-narrowing `if`.
const expectErrors = (result: ConversionResult): ConversionErrors => {
	if (!isConversionErrors(result)) {
		throw new Error('Expected conversion to fail with errors, but it returned data.');
	}
	return result;
};

// ---------------------------------------------------------------------------
// Valid input
// ---------------------------------------------------------------------------

describe('convertMasterScoresToJson — valid input', () => {
	test('produces metadata describing the workbook', () => {
		const data = convertFixture();
		expect(data.metadata.sourceFile).toBe(SOURCE_FILE_NAME);
		expect(data.metadata.availableYears).toEqual([2020, 2024, 2025]);
		expect(data.metadata.totalPlayers).toBe(PLAYERS.length);
		expect(data.metadata.totalGames).toBe(GAME_DEFINITIONS.length);
		expect(new Date(data.metadata.lastUpdated).toString()).not.toBe('Invalid Date');
	});

	test('assigns p_/g_ ids in row and fixed game order', () => {
		const { entities } = convertFixture();
		expect(entities.players).toEqual({
			p_1: { id: 'p_1', name: 'Alice' },
			p_2: { id: 'p_2', name: 'Bob' },
			p_3: { id: 'p_3', name: 'Cara' },
		});
		expect(Object.keys(entities.games)).toEqual(GAME_DEFINITIONS.map((def) => def.gameId));
		expect(entities.games.g_4).toEqual({ id: 'g_4', name: GameName.TenPin });
	});

	test('head-to-head yearly rows carry full goal stats with the sheet-provided ranks', () => {
		const rows = convertFixture().rankings.byGame.g_1.byYear['2020'];
		expect(rows).toEqual([
			{ rank: 1, playerId: 'p_1', played: 2, wins: 2, goalsFor: 6, goalsAgainst: 2, goalDifference: 4 },
			{ rank: 2, playerId: 'p_2', played: 2, wins: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0 },
			{ rank: 3, playerId: 'p_3', played: 2, wins: 0, goalsFor: 2, goalsAgainst: 6, goalDifference: -4 },
		]);
	});

	test('ranks are mirrored verbatim, never recomputed from the stats', () => {
		// Alice's record is the best, but the sheet says she's 4th — the output
		// must reproduce the sheet, warts and all.
		const rows = convertFixture({ overrides: { [GameName.AirHockey]: { K7: '4th' } } })
			.rankings.byGame.g_1.byYear['2020'];
		expect(rows.map((r) => [r.playerId, r.rank])).toEqual([
			['p_2', 2],
			['p_3', 3],
			['p_1', 4],
		]);
	});

	test('tied rows share the rank the sheet gives them', () => {
		const rows = convertFixture().rankings.byGame.g_2.byYear['2020'];
		expect(rows.map((r) => [r.playerId, r.rank])).toEqual([
			['p_1', 1],
			['p_2', 1],
			['p_3', 3],
		]);
	});

	test('legacy Bowls years read points from the legacy column and keep fractions', () => {
		const rows = convertFixture().rankings.byGame.g_3.byYear['2020'];
		expect(rows).toEqual([
			{ rank: 1, playerId: 'p_1', played: 2, wins: 2, points: 5 },
			{ rank: 2, playerId: 'p_2', played: 2, wins: 1, points: 5 },
			{ rank: 3, playerId: 'p_3', played: 2, wins: 1, points: 2.5 },
		]);
	});

	test('modern Bowls years (2024+) read points from the first score column', () => {
		const rows = convertFixture().rankings.byGame.g_3.byYear['2024'];
		expect(rows).toEqual([
			{ rank: 1, playerId: 'p_1', played: 2, wins: 2, points: 6 },
			{ rank: 2, playerId: 'p_2', played: 2, wins: 1, points: 4 },
		]);
	});

	test('all-time tables mirror the running-totals block, absent rows omitted', () => {
		const data = convertFixture();
		expect(data.rankings.byGame.g_3.allTime).toEqual([
			{ rank: 1, playerId: 'p_1', played: 2, wins: 2, goalsFor: 6, goalsAgainst: 2, goalDifference: 4 },
			{ rank: 2, playerId: 'p_2', played: 2, wins: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0 },
			// Cara has no running-totals row (the sheet only counts 2024 onwards).
		]);
		expect(data.rankings.byGame.g_4.allTime).toEqual([
			{ rank: 1, playerId: 'p_2', played: 2, averagePoints: 12 },
			{ rank: 2, playerId: 'p_1', played: 4, averagePoints: 10 },
		]);
	});

	test('Ten Pin yearly ranks come from the sheet (average-based, not total-based)', () => {
		const rows = convertFixture().rankings.byGame.g_4.byYear['2025'];
		expect(rows).toEqual([
			{ rank: 1, playerId: 'p_2', played: 2, points: 24 },
			{ rank: 2, playerId: 'p_1', played: 4, points: 40 },
		]);
	});

	test('Darts yearly rows include the per-year average (1dp) alongside sheet ranks', () => {
		const rows = convertFixture().rankings.byGame.g_5.byYear['2020'];
		expect(rows).toEqual([
			{ rank: 1, playerId: 'p_1', played: 4, points: 100, averagePoints: 25 },
			{ rank: 2, playerId: 'p_2', played: 4, points: 90, averagePoints: 22.5 },
			{ rank: 2, playerId: 'p_3', played: 4, points: 90, averagePoints: 22.5 },
		]);
	});

	test('overall season tables mirror the Overall sheet, "A" totals excluded', () => {
		const { byYear } = convertFixture().rankings.overall;
		expect(Object.keys(byYear).sort()).toEqual(['2020', '2024', '2025']);
		expect(byYear['2020']).toEqual([
			{ rank: 1, playerId: 'p_1', totalGameRanks: 5 },
			{ rank: 2, playerId: 'p_2', totalGameRanks: 8 },
			{ rank: 3, playerId: 'p_3', totalGameRanks: 14 },
		]);
		// Cara's 2024 total is "A" (absent), so she has no 2024 row.
		expect(byYear['2024'].map((r) => r.playerId)).toEqual(['p_1', 'p_2']);
		expect(byYear['2025'][0]).toEqual({ rank: 1, playerId: 'p_2', totalGameRanks: 1 });
	});

	test('champions list the podium as arrays, empty when a place does not exist', () => {
		const { champions } = convertFixture().rankings.overall;
		expect(champions).toEqual([
			{ year: 2020, playerIds: ['p_1'], runnerUpIds: ['p_2'], thirdIds: ['p_3'] },
			{ year: 2024, playerIds: ['p_1'], runnerUpIds: ['p_2'], thirdIds: [] },
			{ year: 2025, playerIds: ['p_2'], runnerUpIds: ['p_1'], thirdIds: [] },
		]);
	});

	test('overall all-time mirrors the Overall sheet with null for unplayed games', () => {
		const { allTime } = convertFixture().rankings.overall;
		expect(allTime).toEqual([
			{
				rank: 1,
				playerId: 'p_1',
				score: 993,
				gameRanks: { g_1: 1, g_2: 1, g_3: 1, g_4: 2, g_5: 1, g_6: 1 },
			},
			{
				rank: 2,
				playerId: 'p_2',
				score: 991,
				gameRanks: { g_1: 2, g_2: 1, g_3: 2, g_4: 1, g_5: 2, g_6: 1 },
			},
			{
				rank: 3,
				playerId: 'p_3',
				score: 989,
				gameRanks: { g_1: 3, g_2: 3, g_3: null, g_4: null, g_5: 2, g_6: 3 },
			},
		]);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('convertMasterScoresToJson — edge cases', () => {
	test('future year blocks are picked up automatically once they contain data', () => {
		const data = convertFixture({
			overrides: { [GameName.Cards]: { CC7: 1, CF7: 10, CJ7: '1st' } }, // 2027 block starts at CC
		});
		expect(data.metadata.availableYears).toContain(2027);
		expect(data.rankings.byGame.g_6.byYear['2027']).toEqual([
			{ rank: 1, playerId: 'p_1', played: 1, points: 10 },
		]);
	});

	test('a played row whose rank cell is blank is omitted, as the sheet shows nothing for it', () => {
		const rows = convertFixture({ overrides: { [GameName.Cards]: { K9: '' } } })
			.rankings.byGame.g_6.byYear['2020'];
		expect(rows.map((r) => r.playerId)).toEqual(['p_1', 'p_2']);
	});

	test('a game sheet with no data yields empty tables, not an error', () => {
		const clear = { BG7: '', BJ7: '', BN7: '', BG8: '', BJ8: '', BN8: '', GO7: '', GR7: '', GV7: '', GO8: '', GR8: '', GV8: '' };
		const data = convertFixture({
			overrides: {
				[GameName.TenPin]: clear,
				[OVERALL_SHEET]: { LD7: '', LD8: '', LT7: '', LT8: '' },
			},
		});
		expect(data.rankings.byGame.g_4.allTime).toEqual([]);
		expect(data.rankings.byGame.g_4.byYear).toEqual({});
		expect(data.metadata.availableYears).toEqual([2020, 2024]);
		expect(Object.keys(data.rankings.overall.byYear).sort()).toEqual(['2020', '2024']);
	});

	test('numeric values stored as text are accepted', () => {
		const data = convertFixture({
			overrides: { [GameName.Cards]: { G7: '60' } },
		});
		expect(data.rankings.byGame.g_6.byYear['2020'][0]).toMatchObject({ playerId: 'p_1', points: 60 });
	});
});

// ---------------------------------------------------------------------------
// Error scenarios
// ---------------------------------------------------------------------------

describe('convertMasterScoresToJson — error scenarios', () => {
	test('an unparseable buffer is reported as CORRUPT_WORKBOOK', () => {
		// A truncated ZIP (xlsx files are ZIPs) reliably makes the parser throw.
		const { errors } = expectErrors(convertMasterScoresToJson(Buffer.from('PK\x03\x04not really a zip')));
		expect(errors).toEqual([
			expect.objectContaining({
				code: ConversionErrorCode.CorruptWorkbook,
				context: expect.objectContaining({ cause: expect.any(String) }),
			}),
		]);
	});

	test('junk the parser mistakes for a CSV still fails, via missing sheets', () => {
		// SheetJS parses arbitrary bytes as a single-sheet CSV rather than
		// throwing, so this surfaces as MISSING_SHEET errors — either way the
		// caller gets a ConversionErrors object, never bad data.
		const { errors } = expectErrors(convertMasterScoresToJson(Buffer.from('definitely not a spreadsheet')));
		expect(errors.length).toBeGreaterThan(0);
		expect(errors.every((e) => e.code === ConversionErrorCode.MissingSheet)).toBe(true);
	});

	test('a missing sheet is reported with its name', () => {
		const { errors } = expectErrors(convertMasterScoresToJson(buildFixtureBuffer({ skipSheets: [GameName.Darts] })));
		expect(errors).toEqual([
			expect.objectContaining({ code: ConversionErrorCode.MissingSheet, context: expect.objectContaining({ sheetName: GameName.Darts }) }),
		]);
	});

	test('a missing Overall sheet is reported too', () => {
		const { errors } = expectErrors(convertMasterScoresToJson(buildFixtureBuffer({ skipSheets: [OVERALL_SHEET] })));
		expect(errors).toEqual([
			expect.objectContaining({ code: ConversionErrorCode.MissingSheet, context: expect.objectContaining({ sheetName: OVERALL_SHEET }) }),
		]);
	});

	test('a workbook with no player names is rejected', () => {
		const { errors } = expectErrors(convertMasterScoresToJson(buildFixtureBuffer({ noPlayers: true })));
		expect(errors.map((e) => e.code)).toContain(ConversionErrorCode.NoPlayers);
	});

	test('sheets that disagree about player rows are rejected', () => {
		const { errors } = expectErrors(convertMasterScoresToJson(
			buildFixtureBuffer({ overrides: { [GameName.Cards]: { A8: 'Robert' } } }),
		));
		expect(errors).toEqual([
			expect.objectContaining({
				code: ConversionErrorCode.PlayerNameMismatch,
				context: expect.objectContaining({ sheetName: GameName.Cards, row: 8, expected: 'Bob', actual: 'Robert' }),
			}),
		]);
	});

	test('non-numeric stat cells are reported with sheet and address, not silently zeroed', () => {
		const { errors } = expectErrors(convertMasterScoresToJson(
			buildFixtureBuffer({ overrides: { [GameName.AirHockey]: { D7: 'two' } } }),
		));
		expect(errors).toEqual([
			expect.objectContaining({
				code: ConversionErrorCode.InvalidCell,
				context: expect.objectContaining({ sheetName: GameName.AirHockey, address: 'D7', value: 'two' }),
			}),
		]);
	});

	test('multiple problems are all reported together', () => {
		const { errors } = expectErrors(convertMasterScoresToJson(
			buildFixtureBuffer({
				overrides: {
					[GameName.AirHockey]: { D7: 'two' },
					[GameName.Cards]: { G9: 'fifty' },
				},
			}),
		));
		expect(errors).toHaveLength(2);
	});
});
