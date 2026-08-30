import { getAllGames, getAllTimeRankings, getGameAllTimeRankings, getGameById, getGameYearRankings, getPlayerById, getYearChampions, getYearRankings } from '../masterScoreSelectors';
import { sampleData } from './testFixtures';

describe('masterScoreSelectors', () => {
	describe('getAllTimeRankings', () => {
		it('returns the overall all-time standings', () => {
			expect(getAllTimeRankings(sampleData)).toBe(sampleData.rankings.overall.allTime);
			expect(getAllTimeRankings(sampleData)[0].playerId).toBe('p_1');
		});
	});

	describe('getYearRankings', () => {
		it('returns the standings for a known year (numeric year, string key)', () => {
			const rows = getYearRankings(sampleData, 2024);
			expect(rows).toHaveLength(2);
			expect(rows[0].playerId).toBe('p_1');
		});

		it('returns an empty array for an unknown year', () => {
			expect(getYearRankings(sampleData, 1999)).toEqual([]);
		});
	});

	describe('getYearChampions', () => {
		it('finds the champions for a known year', () => {
			expect(getYearChampions(sampleData, 2024)?.playerIds).toEqual(['p_1']);
		});

		it('returns undefined for an unknown year', () => {
			expect(getYearChampions(sampleData, 1999)).toBeUndefined();
		});
	});

	describe('getAllGames', () => {
		it('returns every game', () => {
			expect(getAllGames(sampleData).map((game) => game.id)).toEqual(['g_1', 'g_2']);
		});
	});

	describe('getGameById', () => {
		it('returns a known game', () => {
			expect(getGameById(sampleData, 'g_1')?.name).toBe('Air Hockey');
		});

		it('returns undefined for an unknown game', () => {
			expect(getGameById(sampleData, 'g_99')).toBeUndefined();
		});
	});

	describe('getGameAllTimeRankings', () => {
		it('returns the all-time leaderboard for a game', () => {
			expect(getGameAllTimeRankings(sampleData, 'g_1')[0].playerId).toBe('p_1');
		});

		it('returns an empty array for an unknown game', () => {
			expect(getGameAllTimeRankings(sampleData, 'g_99')).toEqual([]);
		});
	});

	describe('getGameYearRankings', () => {
		it('returns the per-year leaderboard for a game', () => {
			expect(getGameYearRankings(sampleData, 'g_2', 2024)[0].playerId).toBe('p_2');
		});

		it('returns an empty array for an unknown game or year', () => {
			expect(getGameYearRankings(sampleData, 'g_99', 2024)).toEqual([]);
			expect(getGameYearRankings(sampleData, 'g_2', 1999)).toEqual([]);
		});
	});

	describe('getPlayerById', () => {
		it('returns a known player', () => {
			expect(getPlayerById(sampleData, 'p_2')?.name).toBe('Bob');
		});

		it('returns undefined for an unknown player', () => {
			expect(getPlayerById(sampleData, 'p_99')).toBeUndefined();
		});
	});
});
