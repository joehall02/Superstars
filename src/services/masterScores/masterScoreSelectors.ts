import { type Game, type GameAllTimeRanking, type GameYearRanking, type OverallAllTimeRanking, type OverallYearRanking, type Player, type SuperstarsData, type YearChampion } from '../../../shared/types';

/**
 * Pure extraction functions over {@link SuperstarsData}. Hooks in `useMasterScores.ts`
 * wrap these as React Query `select` functions.
 *
 * Note: `byYear` maps are keyed by year *strings*, while callers pass numeric
 * years, so we index with `String(year)`.
 */

/** Rankings Page — all-time standings table. */
export const getAllTimeRankings = (data: SuperstarsData): OverallAllTimeRanking[] =>
	data.rankings.overall.allTime;

/** Rankings Page — per-year player rankings table. */
export const getYearRankings = (data: SuperstarsData, year: number): OverallYearRanking[] =>
	data.rankings.overall.byYear[String(year)] ?? [];

/** Rankings Page — the champions podium for a given year. */
export const getYearChampions = (data: SuperstarsData, year: number): YearChampion | undefined =>
	data.rankings.overall.champions.find((champion) => champion.year === year);

/** Games Page — every game, for the grid display. */
export const getAllGames = (data: SuperstarsData): Game[] => Object.values(data.entities.games);

/** Game Details Page — game name for the header. */
export const getGameById = (data: SuperstarsData, id: string): Game | undefined =>
	data.entities.games[id];

/** Game Details Page — all-time leaderboard for a game. */
export const getGameAllTimeRankings = (
	data: SuperstarsData,
	gameId: string,
): GameAllTimeRanking[] => data.rankings.byGame[gameId]?.allTime ?? [];

/** Game Details Page — per-year leaderboard for a game. */
export const getGameYearRankings = (
	data: SuperstarsData,
	gameId: string,
	year: number,
): GameYearRanking[] => data.rankings.byGame[gameId]?.byYear[String(year)] ?? [];

/** ProfileCard — player name. */
export const getPlayerById = (data: SuperstarsData, id: string): Player | undefined =>
	data.entities.players[id];
