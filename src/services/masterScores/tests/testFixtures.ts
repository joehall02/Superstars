import { type SuperstarsData } from '../../../../shared/types';

/**
 * Small but structurally complete {@link SuperstarsData} fixture for selector and
 * guard tests: 2 players, 2 games (one head-to-head, one average-points), 1 year.
 */
export const sampleData: SuperstarsData = {
	metadata: {
		lastUpdated: '2026-01-01T00:00:00.000Z',
		sourceFile: 'test.xlsx',
		availableYears: [2024],
		totalPlayers: 2,
		totalGames: 2,
	},
	entities: {
		players: {
			p_1: { id: 'p_1', name: 'Alice' },
			p_2: { id: 'p_2', name: 'Bob' },
		},
		games: {
			g_1: { id: 'g_1', name: 'Air Hockey' },
			g_2: { id: 'g_2', name: 'Ten Pin' },
		},
	},
	rankings: {
		overall: {
			allTime: [
				{ rank: 1, playerId: 'p_1', score: 998, gameRanks: { g_1: 1, g_2: 2 } },
				{ rank: 2, playerId: 'p_2', score: 997, gameRanks: { g_1: 2, g_2: 1 } },
			],
			byYear: {
				'2024': [
					{ rank: 1, playerId: 'p_1', totalGameRanks: 3 },
					{ rank: 2, playerId: 'p_2', totalGameRanks: 3 },
				],
			},
			champions: [{ year: 2024, playerIds: ['p_1'], runnerUpIds: ['p_2'], thirdIds: [] }],
		},
		byGame: {
			g_1: {
				allTime: [
					{
						rank: 1,
						playerId: 'p_1',
						played: 5,
						wins: 4,
						goalsFor: 20,
						goalsAgainst: 10,
						goalDifference: 10,
					},
				],
				byYear: {
					'2024': [
						{
							rank: 1,
							playerId: 'p_1',
							played: 5,
							wins: 4,
							goalsFor: 20,
							goalsAgainst: 10,
							goalDifference: 10,
						},
					],
				},
			},
			g_2: {
				allTime: [{ rank: 1, playerId: 'p_2', played: 3, averagePoints: 150 }],
				byYear: {
					'2024': [{ rank: 1, playerId: 'p_2', played: 3, points: 450 }],
				},
			},
		},
	},
};
