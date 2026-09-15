import { type Game } from '../../../shared/types';
import { type StatLabels } from '../../types/config.types';
import { buildGameLegend, buildStatLegend } from '../legend';

describe('buildStatLegend', () => {
	const labels: StatLabels = { played: 'Played', goalsFor: 'GF', goalDifference: 'GD' };
	const decode = (key: string) => ({ goalsFor: 'Goals For', goalDifference: 'Goal Difference' }[key]);

	test('decodes each abbreviation to its full description', () => {
		expect(buildStatLegend(labels, decode)).toEqual([
			{ abbreviation: 'GF', description: 'Goals For' },
			{ abbreviation: 'GD', description: 'Goal Difference' },
		]);
	});

	test('drops entries with no description or one equal to the abbreviation', () => {
		// `played` has no description (falls back to itself) so it is filtered out.
		expect(buildStatLegend(labels, decode).map((entry) => entry.abbreviation)).not.toContain('Played');
	});
});

describe('buildGameLegend', () => {
	const games: Game[] = [
		{ id: 'g_1', name: 'Air Hockey' },
		{ id: 'g_2', name: 'Bar Football' },
	];
	const getAbbreviation = (id: string) => ({ g_1: 'AIR' }[id]);
	const getIcon = (id: string) => `/icons/${id}.svg`;

	test('maps each game to its abbreviation, name and icon', () => {
		expect(buildGameLegend(games, getAbbreviation, getIcon)).toEqual([
			{ abbreviation: 'AIR', description: 'Air Hockey', icon: '/icons/g_1.svg' },
			{ abbreviation: 'Bar Football', description: 'Bar Football', icon: '/icons/g_2.svg' },
		]);
	});
});
