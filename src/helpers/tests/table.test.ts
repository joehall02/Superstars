import { type Game, type OverallAllTimeRanking, type OverallYearRanking, type Player } from '../../../shared/types';
import { type StatLabels } from '../../types/config.types';
import { buildGameRankColumns, buildOverallColumns } from '../table';

describe('buildOverallColumns', () => {
	const players: Record<string, Player> = { p_1: { id: 'p_1', name: 'Alice' } };
	const labels: StatLabels = { score: 'Score' };

	test('prepends the rank + player prefix to the config stat columns', () => {
		expect(buildOverallColumns(labels, players).map((column) => column.key)).toEqual(['rank', 'playerId', 'score']);
	});

	test('resolves the player name via getValue, falling back to the id', () => {
		const [, player] = buildOverallColumns(labels, players);

		expect(player.getValue?.({ rank: 1, playerId: 'p_1', score: 998, gameRanks: {} })).toBe('Alice');
		expect(player.getValue?.({ rank: 2, playerId: 'p_x', score: 996, gameRanks: {} })).toBe('p_x');
	});

	test('reads the overall score via getValue', () => {
		const [, , score] = buildOverallColumns(labels, players);

		expect(score.getValue?.({ rank: 1, playerId: 'p_1', score: 998, gameRanks: {} })).toBe(998);
	});
});

describe('buildGameRankColumns', () => {
	const games: Game[] = [
		{ id: 'g_1', name: 'Air Hockey' },
		{ id: 'g_2', name: 'Bar Footy' },
	];

	test('builds one column per game, keyed and labelled by the game', () => {
		expect(buildGameRankColumns(games).map((column) => [column.key, column.label])).toEqual([
			['g_1', 'Air Hockey'],
			['g_2', 'Bar Footy'],
		]);
	});

	test('reads the per-game rank from gameRanks, null when the game is unplayed', () => {
		const [airHockey, barFooty] = buildGameRankColumns(games);
		const row: OverallAllTimeRanking = { rank: 1, playerId: 'p_1', score: 998, gameRanks: { g_1: 2, g_2: null } };

		expect(airHockey.getValue?.(row)).toBe(2);
		expect(barFooty.getValue?.(row)).toBeNull();
	});

	test('returns null for rows without gameRanks (e.g. per-year rows)', () => {
		const [airHockey] = buildGameRankColumns(games);
		const yearRow: OverallYearRanking = { rank: 1, playerId: 'p_1', totalGameRanks: 5 };

		expect(airHockey.getValue?.(yearRow)).toBeNull();
	});
});
