import * as XLSX from 'xlsx';

import { GameKind } from '../shared/enums';
import { type ConversionResult, type GameAllTimeRanking, type GameRankings, type GameRanks, type GameYearRanking, type OverallAllTimeRanking, type OverallYearRanking, type SuperstarsData, type YearChampion } from '../shared/types';
import { ALL_TIME_COLS, BOWLS_NEW_FORMAT_FROM, GAME_DEFINITIONS, OFFSET, OVERALL_COLS, OVERALL_SHEET, PLAYER_FIRST_ROW, PLAYER_LAST_ROW, SOURCE_FILE_NAME, YEAR_BLOCKS } from './consts';
import { corruptWorkbookError, missingSheetError, noPlayersError, playerNameMismatchError } from './errors';
import { type GameDefinition, type PlayerRoster, type RawGameStats, type RawYearStats, type ReadContext, type YearStats } from './types';
import { columnOffset, readCellNumber, readCellRank, readCellString, readComputedNumber, round } from './utils';

// ---------------------------------------------------------------------------
// Raw extraction
// ---------------------------------------------------------------------------

/**
 * Reads every year block of a game sheet into raw per-player stats.
 *
 * A player/year entry is only created when the "played" cell holds a non-zero
 * number; wins and both score columns default to 0 when blank, and the sheet's
 * computed yearly rank is captured alongside (null when the sheet shows none).
 *
 * @param sheet - The game worksheet to read.
 * @param sheetName - The sheet's name, used in INVALID_CELL error reports.
 * @param playerRows - The 1-indexed worksheet rows that hold players.
 * @param ctx - Read context that accumulates INVALID_CELL errors.
 * @returns Map of player row → (year → raw stats) for every played season.
 */
const extractRawGameStats = (
	sheet: XLSX.WorkSheet,
	sheetName: string,
	playerRows: number[],
	ctx: ReadContext,
): RawGameStats => {
	const raw: RawGameStats = new Map();
	for (const row of playerRows) {
		const byYear = new Map<number, RawYearStats>();
		for (const { year, startCol } of YEAR_BLOCKS) {
			// Step 1: The "played" cell decides whether this player/year
			// exists at all — blank or zero means they didn't play, and the
			// rest of the block isn't read.
			const played = readCellNumber(sheet, sheetName, `${columnOffset(startCol, OFFSET.played)}${row}`, ctx);
			if (played === null || played === 0) continue;

			// Step 2: Read the rest of the block relative to its start column.
			// Blank stat cells default to 0 (the sheet's SUM formulas treat
			// them the same); the rank keeps null so "sheet shows no rank"
			// stays distinguishable downstream.
			byYear.set(year, {
				played,
				wins: readCellNumber(sheet, sheetName, `${columnOffset(startCol, OFFSET.wins)}${row}`, ctx) ?? 0,
				primary: readCellNumber(sheet, sheetName, `${columnOffset(startCol, OFFSET.primary)}${row}`, ctx) ?? 0,
				secondary: readCellNumber(sheet, sheetName, `${columnOffset(startCol, OFFSET.secondary)}${row}`, ctx) ?? 0,
				rank: readCellRank(sheet, `${columnOffset(startCol, OFFSET.rank)}${row}`),
			});
		}

		// Step 3: Players with no seasons at all get no entry, so consumers
		// can iterate the map without re-checking for empty players.
		if (byYear.size > 0) raw.set(row, byYear);
	}
	return raw;
};

// ---------------------------------------------------------------------------
// Per-game table builders
// ---------------------------------------------------------------------------

/**
 * Resolves a pre-2024 Bowls points value.
 *
 * Before 2024 the Bowls points were recorded in the block's second score
 * column; falls back to the first column if a row was entered the modern way.
 *
 * @param stats - The raw year stats for one player.
 * @returns The points value for that legacy Bowls season.
 */
const bowlsLegacyPoints = (stats: RawYearStats): number =>
	stats.secondary !== 0 ? stats.secondary : stats.primary;

/**
 * Shapes one player's raw year stats into the flat stat fields for their
 * yearly ranking row, according to the game's kind: head-to-head games get
 * goal stats, Bowls gets points (+wins), Darts adds the per-year average
 * (mirroring the sheet's hidden helper column), and points games get points.
 *
 * @param def - The game being built.
 * @param year - The season year (decides which Bowls layout applies).
 * @param stats - The player's raw stats for that year.
 * @returns The stat portion of a GameYearRanking row (no rank/playerId).
 */
const buildYearRow = (def: GameDefinition, year: number, stats: RawYearStats): YearStats => {
	switch (def.kind) {
		case GameKind.HeadToHead:
			return {
				played: stats.played,
				wins: stats.wins,
				goalsFor: stats.primary,
				goalsAgainst: stats.secondary,
				goalDifference: stats.primary - stats.secondary,
			};
		case GameKind.Bowls:
			return {
				played: stats.played,
				wins: stats.wins,
				points: year >= BOWLS_NEW_FORMAT_FROM ? stats.primary : bowlsLegacyPoints(stats),
			};
		case GameKind.AveragePoints:
			return def.includeYearAverage
				? { played: stats.played, points: stats.primary, averagePoints: round(stats.primary / stats.played, 1) }
				: { played: stats.played, points: stats.primary };
		case GameKind.TotalPoints:
			return { played: stats.played, points: stats.primary };
	}
};

/**
 * Builds a game's per-year ranking tables from the extracted raw stats.
 *
 * Ranks are the sheet's own computed values, mirrored verbatim. A played row
 * whose rank cell is blank/erroring is omitted — exactly as the sheet's rank
 * column shows nothing for it. Years with no rows are left out entirely.
 *
 * @param def - The game being built.
 * @param raw - Raw stats from {@link extractRawGameStats}.
 * @param playerIdByRow - Worksheet row → player id mapping.
 * @returns Year (as string) → ranking rows sorted by rank.
 */
const buildGameByYear = (
	def: GameDefinition,
	raw: RawGameStats,
	playerIdByRow: Map<number, string>,
): Record<string, GameYearRanking[]> => {
	const byYear: Record<string, GameYearRanking[]> = {};
	for (const { year } of YEAR_BLOCKS) {
		// Step 1: Gather the season's rows from the raw stats. A player needs
		// both stats for the year and a rank — a played row with no rank in
		// the sheet is omitted, exactly as the sheet's own rank column shows
		// nothing for it.
		const rows: GameYearRanking[] = [];
		for (const [row, years] of raw) {
			const stats = years.get(year);
			if (!stats || stats.rank === null) continue;

			// Step 2: Flatten into the output row — the sheet's rank, the
			// player id, and the kind-specific stat fields from buildYearRow.
			rows.push({
				rank: stats.rank,
				playerId: playerIdByRow.get(row)!,
				...buildYearRow(def, year, stats),
			});
		}

		// Step 3: Seasons with no rows (unplayed years) are left out entirely;
		// the rest are keyed by year and ordered by the sheet's ranks.
		if (rows.length === 0) continue;
		rows.sort((a, b) => a.rank - b.rank);
		byYear[String(year)] = rows;
	}
	return byYear;
};

/**
 * Builds a game's all-time table straight from the sheet's "Running Totals"
 * block (GO..GV) — stats and ranks are the sheet's own computed values.
 *
 * Players whose running-totals row is blank or erroring are omitted, mirroring
 * the sheet (e.g. Bowls only counts 2024 onwards, so a pre-2024-only player
 * has no row). Head-to-head and Bowls rows carry goal stats; points games
 * carry the career average, rounded to 2dp to strip cached float noise.
 *
 * @param def - The game being built.
 * @param sheet - The game worksheet.
 * @param playerIdByRow - Worksheet row → player id mapping.
 * @returns All-time ranking rows sorted by rank.
 */
const buildGameAllTime = (
	def: GameDefinition,
	sheet: XLSX.WorkSheet,
	playerIdByRow: Map<number, string>,
): GameAllTimeRanking[] => {
	const rows: GameAllTimeRanking[] = [];
	for (const [row, playerId] of playerIdByRow) {
		// Step 1: Read the player's career games-played and rank. The sheet
		// leaves the running-totals row blank/erroring for players with
		// nothing to count (e.g. Bowls only counts 2024 onwards) — mirror
		// that by skipping the row.
		const played = readComputedNumber(sheet, `${ALL_TIME_COLS.played}${row}`);
		const rank = readCellRank(sheet, `${ALL_TIME_COLS.rank}${row}`);
		if (played === null || played === 0 || rank === null) continue;

		// Step 2: Shape the row by game kind. Head-to-head and Bowls carry
		// full goal stats (goal difference falls back to GF − GA when the
		// sheet's Df cell is blank); points games carry the career average,
		// rounded to 2dp to strip cached float noise (e.g. 8.8800000000000008).
		if (def.kind === GameKind.HeadToHead || def.kind === GameKind.Bowls) {
			const goalsFor = readComputedNumber(sheet, `${ALL_TIME_COLS.primary}${row}`) ?? 0;
			const goalsAgainst = readComputedNumber(sheet, `${ALL_TIME_COLS.secondary}${row}`) ?? 0;
			rows.push({
				rank,
				playerId,
				played,
				wins: readComputedNumber(sheet, `${ALL_TIME_COLS.wins}${row}`) ?? 0,
				goalsFor,
				goalsAgainst,
				goalDifference:
                    readComputedNumber(sheet, `${ALL_TIME_COLS.difference}${row}`) ?? goalsFor - goalsAgainst,
			});
		} else {
			const average = readComputedNumber(sheet, `${ALL_TIME_COLS.primary}${row}`) ?? 0;
			rows.push({ rank, playerId, played, averagePoints: round(average, 2) });
		}
	}

	// Step 3: Order the table by the sheet's ranks (joint places keep their
	// shared rank).
	rows.sort((a, b) => a.rank - b.rank);
	return rows;
};

// ---------------------------------------------------------------------------
// Overall (cross-game) builders — read straight from the Overall sheet
// ---------------------------------------------------------------------------

/**
 * Builds the overall season tables from the Overall sheet's total/rank column
 * pairs (one pair per year).
 *
 * A player appears in a season only when both their total and numeric rank are
 * present — "A" totals and #VALUE! ranks are the sheet's absent markers and
 * exclude the row. Empty years are left out entirely.
 *
 * @param overallSheet - The Overall worksheet.
 * @param playerIdByRow - Worksheet row → player id mapping.
 * @returns Year (as string) → season rows sorted by rank, then total.
 */
const buildOverallByYear = (
	overallSheet: XLSX.WorkSheet,
	playerIdByRow: Map<number, string>,
): Record<string, OverallYearRanking[]> => {
	const byYear: Record<string, OverallYearRanking[]> = {};
	YEAR_BLOCKS.forEach(({ year }, index) => {
		// Step 1: Locate the season's total/rank column pair — yearTotals and
		// yearRanks are aligned with YEAR_BLOCKS by index.
		const totalCol = OVERALL_COLS.yearTotals[index];
		const rankCol = OVERALL_COLS.yearRanks[index];

		// Step 2: Read each player's season total and numeric rank. "A" totals
		// and #VALUE! ranks are the sheet's absent markers — a player needs
		// both values to get a row.
		const rows: OverallYearRanking[] = [];
		for (const [row, playerId] of playerIdByRow) {
			const total = readComputedNumber(overallSheet, `${totalCol}${row}`);
			const rank = readCellRank(overallSheet, `${rankCol}${row}`);
			if (total === null || rank === null) continue;
			rows.push({ rank, playerId, totalGameRanks: total });
		}

		// Step 3: Seasons with no rows (unplayed years) are left out entirely;
		// the rest are keyed by year, ordered by rank with the total as a
		// deterministic tiebreak.
		if (rows.length === 0) return;
		rows.sort((a, b) => a.rank - b.rank || a.totalGameRanks - b.totalGameRanks);
		byYear[String(year)] = rows;
	});
	return byYear;
};

/**
 * Derives the year-champions podium from the overall season tables.
 *
 * The podium is grouped by distinct rank so joint places share a group, which
 * is why each place is an array of player ids. Places that don't exist (e.g.
 * no third when only two ranks occur) are empty arrays.
 *
 * @param byYear - Season tables from {@link buildOverallByYear}.
 * @returns One champions entry per season, in ascending year order.
 */
const buildChampions = (byYear: Record<string, OverallYearRanking[]>): YearChampion[] =>
	Object.entries(byYear)
		.map(([year, rows]) => {
			// Step 1: Find the season's distinct ranks in ascending order.
			// Each distinct rank is one podium group — joint places share a
			// rank, so a group can hold several players.
			const distinctRanks = [...new Set(rows.map((r) => r.rank))].sort((a, b) => a - b);

			// Step 2: Collect every player at a group's rank; a group that
			// doesn't exist (fewer than three distinct ranks) yields [].
			const playersAtRank = (rank: number | undefined): string[] =>
				rank === undefined ? [] : rows.filter((r) => r.rank === rank).map((r) => r.playerId);

			// Step 3: The first three groups are the podium.
			return {
				year: Number(year),
				playerIds: playersAtRank(distinctRanks[0]),
				runnerUpIds: playersAtRank(distinctRanks[1]),
				thirdIds: playersAtRank(distinctRanks[2]),
			};
		})
	// Step 4: One entry per season, oldest first.
		.sort((a, b) => a.year - b.year);

/**
 * Builds the all-time overall standings from the Overall sheet: the score
 * (1000 minus the sum of game ranks), the numeric rank, and the player's
 * all-time rank in each game (null where they have never played it).
 *
 * Players with no readable score or rank are omitted, mirroring the sheet.
 *
 * @param overallSheet - The Overall worksheet.
 * @param playerIdByRow - Worksheet row → player id mapping.
 * @returns Standings rows sorted by rank, then score.
 */
const buildOverallAllTime = (
	overallSheet: XLSX.WorkSheet,
	playerIdByRow: Map<number, string>,
): OverallAllTimeRanking[] => {
	const rows: OverallAllTimeRanking[] = [];
	for (const [row, playerId] of playerIdByRow) {
		// Step 1: Read the player's score and numeric rank. Either missing
		// (blank or #VALUE!) means the sheet has no standing for them — skip
		// the row rather than invent one.
		const score = readComputedNumber(overallSheet, `${OVERALL_COLS.score}${row}`);
		const rank = readCellRank(overallSheet, `${OVERALL_COLS.rank}${row}`);
		if (score === null || rank === null) continue;

		// Step 2: Read the player's all-time rank in each game from the six
		// consecutive columns, in GAME_DEFINITIONS order. An unreadable cell
		// becomes null — the shape's marker for "never played this game".
		const gameRanks: GameRanks = {};
		GAME_DEFINITIONS.forEach((def, index) => {
			gameRanks[def.gameId] = readCellRank(
				overallSheet,
				`${columnOffset(OVERALL_COLS.gameRankStart, index)}${row}`,
			);
		});
		rows.push({ rank, playerId, score, gameRanks });
	}

	// Step 3: Order the table by rank, with score as a deterministic tiebreak
	// for joint places.
	rows.sort((a, b) => a.rank - b.rank || b.score - a.score);
	return rows;
};

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

/**
 * Reads the player roster from column A of the first game sheet and assigns
 * sequential `p_1..p_n` ids in row order.
 *
 * Cross-checks every other game sheet against the roster — a differing name
 * in any row would silently attribute stats to the wrong player, so mismatches
 * are reported as PLAYER_NAME_MISMATCH errors. An empty roster reports
 * NO_PLAYERS.
 *
 * @param workbook - The parsed workbook.
 * @param ctx - Read context that accumulates roster errors.
 * @returns The roster mappings (empty on NO_PLAYERS).
 */
const extractPlayers = (workbook: XLSX.WorkBook, ctx: ReadContext): PlayerRoster => {
	// Step 1: Read the roster from the first game sheet's roster column. Blank
	// rows are simply skipped, so the roster can be shorter than the range.
	const firstSheet = workbook.Sheets[GAME_DEFINITIONS[0].sheetName];
	const namesByRow = new Map<number, string>();
	for (let row = PLAYER_FIRST_ROW; row <= PLAYER_LAST_ROW; row++) {
		const name = readCellString(firstSheet, `A${row}`);
		if (name !== null) namesByRow.set(row, name);
	}

	// Step 2: An empty roster means nothing else can be attributed to anyone —
	// report NO_PLAYERS and bail with empty mappings.
	if (namesByRow.size === 0) {
		ctx.errors.push(noPlayersError(GAME_DEFINITIONS[0].sheetName, PLAYER_FIRST_ROW, PLAYER_LAST_ROW));
		return { playerIdByRow: new Map(), namesByRow };
	}

	// Step 3: Cross-check the other game sheets against the roster. Every
	// sheet must agree on who sits in each row — stats would silently be
	// attributed to the wrong player otherwise.
	for (const def of GAME_DEFINITIONS.slice(1)) {
		const sheet = workbook.Sheets[def.sheetName];
		if (!sheet) continue; // reported separately as MISSING_SHEET
		for (const [row, expected] of namesByRow) {
			const actual = readCellString(sheet, `A${row}`);
			if (actual !== expected) {
				ctx.errors.push(playerNameMismatchError(def.sheetName, row, expected, actual, GAME_DEFINITIONS[0].sheetName));
			}
		}
	}

	// Step 4: Assign sequential p_ ids in ascending row order. Iterating
	// namesByRow's keys is what guarantees both maps share the same rows.
	const playerIdByRow = new Map<number, string>();
	let index = 1;
	for (const row of [...namesByRow.keys()].sort((a, b) => a - b)) {
		playerIdByRow.set(row, `p_${index}`);
		index++;
	}
	return { playerIdByRow, namesByRow };
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Converts the Master Scores workbook into the SuperstarsData JSON contract.
 *
 * Pure function — no I/O beyond the supplied buffer. The output mirrors the
 * spreadsheet verbatim (see docs/conversion-architecture.md). Failures are
 * returned, not thrown: an unparseable buffer, missing sheets, an empty
 * roster, roster mismatches between sheets, or non-numeric raw stat cells all
 * produce a ConversionErrors object listing every problem found, which the
 * client can interpret accordingly.
 *
 * @param buffer - The .xlsx file contents.
 * @returns The converted SuperstarsData, or ConversionErrors on failure.
 */
export const convertMasterScoresToJson = (buffer: Buffer): ConversionResult => {
	const ctx: ReadContext = { errors: [] };

	// Step 1: Parse the buffer. XLSX.read only throws on structurally broken
	// buffers (e.g. truncated zips). Garbage data that it manages to parse
	// anyway (it falls back to treating unknown bytes as CSV) comes back as a
	// single-sheet workbook and is caught by the required-sheets check below.
	let workbook: XLSX.WorkBook;
	try {
		workbook = XLSX.read(buffer, { type: 'buffer' });
	} catch (error) {
		return { errors: [corruptWorkbookError(error)] };
	}

	// Step 2: Require every sheet. Everything after this return dereferences
	// the sheets directly, so all seven must exist before any are read.
	const requiredSheets = [...GAME_DEFINITIONS.map((def) => def.sheetName), OVERALL_SHEET];
	const missingSheets = requiredSheets.filter((sheetName) => !workbook.Sheets[sheetName]);
	for (const sheetName of missingSheets) {
		ctx.errors.push(missingSheetError(sheetName));
	}
	if (missingSheets.length > 0) return { errors: ctx.errors };

	// Step 3: Read the player roster. Roster problems make every later table
	// unsafe to build (stats would attach to the wrong players), so flush
	// them before extracting anything.
	const { playerIdByRow, namesByRow } = extractPlayers(workbook, ctx);
	if (ctx.errors.length > 0) return { errors: ctx.errors };

	// Step 4: Build the per-game tables. This pass also yields availableYears:
	// a year exists once any game has data for it.
	const byGame: Record<string, GameRankings> = {};
	const yearsWithData = new Set<number>();

	for (const def of GAME_DEFINITIONS) {
		const sheet = workbook.Sheets[def.sheetName];
		const raw = extractRawGameStats(sheet, def.sheetName, [...playerIdByRow.keys()], ctx);
		for (const years of raw.values()) {
			for (const year of years.keys()) yearsWithData.add(year);
		}
		byGame[def.gameId] = {
			allTime: buildGameAllTime(def, sheet, playerIdByRow),
			byYear: buildGameByYear(def, raw, playerIdByRow),
		};
	}

	// Step 5: Second error checkpoint, new errors: extraction above may have
	// accumulated INVALID_CELL reports. Malformed raw stat cells are fatal —
	// silently zeroing them would misrepresent what the spreadsheet contains.
	if (ctx.errors.length > 0) return { errors: ctx.errors };

	// Step 6: Build the overall tables straight from the Overall sheet.
	// byYear is built first because champions are derived from it — the only
	// table not read from a sheet.
	const overallSheet = workbook.Sheets[OVERALL_SHEET];
	const overallByYear = buildOverallByYear(overallSheet, playerIdByRow);

	// Step 7: Final assembly — pure mapping.
	const data: SuperstarsData = {
		metadata: {
			lastUpdated: new Date().toISOString(),
			sourceFile: SOURCE_FILE_NAME,
			availableYears: [...yearsWithData].sort((a, b) => a - b),
			totalPlayers: playerIdByRow.size,
			totalGames: GAME_DEFINITIONS.length,
		},
		entities: {
			players: Object.fromEntries(
				[...playerIdByRow.entries()].map(([row, id]) => [id, { id, name: namesByRow.get(row)! }]),
			),
			games: Object.fromEntries(
				GAME_DEFINITIONS.map((def) => [def.gameId, { id: def.gameId, name: def.sheetName }]),
			),
		},
		rankings: {
			overall: {
				allTime: buildOverallAllTime(overallSheet, playerIdByRow),
				byYear: overallByYear,
				champions: buildChampions(overallByYear),
			},
			byGame,
		},
	};

	return data;
};
