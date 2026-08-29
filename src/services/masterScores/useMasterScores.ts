import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { type Game, type GameAllTimeRanking, type GameYearRanking, type OverallAllTimeRanking, type OverallYearRanking, type Player, type SuperstarsData, type YearChampion } from '../../../shared/types';
import { fetchMasterScores } from './fetchMasterScores';
import { getAllGames, getAllTimeRankings, getGameAllTimeRankings, getGameById, getGameYearRankings, getPlayerById, getYearChampions, getYearRankings } from './masterScoreSelectors';

/**
 * The whole dataset is fetched once under a single query key; every hook below
 * reuses that cache entry and derives its slice via `select`, so there are no
 * redundant refetches. React Query supplies loading/error/data state.
 */
export const masterScoresKey = ['masterScores'];

const useMasterScoresQuery = <T>(select: (data: SuperstarsData) => T): UseQueryResult<T> =>
	useQuery({ queryKey: masterScoresKey, queryFn: fetchMasterScores, select });

export const useAllTimeRankings = (): UseQueryResult<OverallAllTimeRanking[]> =>
	useMasterScoresQuery(getAllTimeRankings);

export const useYearRankings = (year: number): UseQueryResult<OverallYearRanking[]> =>
	useMasterScoresQuery((data) => getYearRankings(data, year));

export const useYearChampions = (year: number): UseQueryResult<YearChampion | undefined> =>
	useMasterScoresQuery((data) => getYearChampions(data, year));

export const useAllGames = (): UseQueryResult<Game[]> => useMasterScoresQuery(getAllGames);

export const useGame = (gameId: string): UseQueryResult<Game | undefined> =>
	useMasterScoresQuery((data) => getGameById(data, gameId));

export const useGameAllTimeRankings = (gameId: string): UseQueryResult<GameAllTimeRanking[]> =>
	useMasterScoresQuery((data) => getGameAllTimeRankings(data, gameId));

export const useGameYearRankings = (
	gameId: string,
	year: number,
): UseQueryResult<GameYearRanking[]> =>
	useMasterScoresQuery((data) => getGameYearRankings(data, gameId, year));

export const usePlayer = (playerId: string): UseQueryResult<Player | undefined> =>
	useMasterScoresQuery((data) => getPlayerById(data, playerId));
