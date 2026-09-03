import { describe, expect, it } from 'vitest';

import { StatType } from '../../../enums/config';
import { type AppConfig } from '../../../types/config.types';
import { createConfigService } from '../configService';

const config: AppConfig = {
	images: {
		games: { g_1: { imageUrl: '/games/air-hockey.jpg', iconUrl: '/games/icons/air-hockey.png' } },
		players: { p_1: { imageUrl: '/players/p_1.png' } },
	},
	localisation: {
		games: { g_1: { summary: 'Air hockey.', rules: 'First to 5.' } },
	},
	stats: {
		statGroups: {
			headToHead: { played: 'Played', wins: 'Wins', goalsFor: 'GF' },
			pointsOnly: { played: 'Played', points: 'Points' },
		},
		games: { g_1: { allTime: 'headToHead', byYear: 'pointsOnly' } },
		overall: { allTime: { score: 'Score' }, byYear: { totalGameRanks: 'Total Ranks' } },
	},
	layout: {
		navLinks: [{ id: 'rankings', label: 'Rankings', path: '/rankings', icon: 'leaderboard' }],
	},
};

const BASE = 'https://cdn.example.com';

const serviceWithBase = () => createConfigService(config, BASE);

describe('createConfigService', () => {
	describe('image getters', () => {
		it('prepends the GCS base to game image, game icon and player icon paths', () => {
			const service = serviceWithBase();

			expect(service.getGameImage('g_1')).toBe(`${BASE}/games/air-hockey.jpg`);
			expect(service.getGameIcon('g_1')).toBe(`${BASE}/games/icons/air-hockey.png`);
			expect(service.getPlayerIcon('p_1')).toBe(`${BASE}/players/p_1.png`);
		});

		it('returns undefined for unknown ids', () => {
			const service = serviceWithBase();

			expect(service.getGameImage('nope')).toBeUndefined();
			expect(service.getGameIcon('nope')).toBeUndefined();
			expect(service.getPlayerIcon('nope')).toBeUndefined();
		});

		it('falls back to a bare path when no base URL is configured', () => {
			const service = createConfigService(config, '');

			expect(service.getGameImage('g_1')).toBe('/games/air-hockey.jpg');
		});
	});

	describe('getStatLabels', () => {
		it('resolves game → stat group → labels for each type, preserving key order', () => {
			const service = serviceWithBase();

			expect(Object.entries(service.getStatLabels('g_1', StatType.AllTime))).toEqual([
				['played', 'Played'],
				['wins', 'Wins'],
				['goalsFor', 'GF'],
			]);
			expect(service.getStatLabels('g_1', StatType.ByYear)).toEqual({ played: 'Played', points: 'Points' });
		});

		it('returns an empty object for unknown games', () => {
			expect(serviceWithBase().getStatLabels('nope', StatType.AllTime)).toEqual({});
		});
	});

	describe('getOverallStatLabels', () => {
		it('returns the overall labels for each type', () => {
			const service = serviceWithBase();

			expect(service.getOverallStatLabels(StatType.AllTime)).toEqual({ score: 'Score' });
			expect(service.getOverallStatLabels(StatType.ByYear)).toEqual({ totalGameRanks: 'Total Ranks' });
		});
	});

	it('getGameLocalisation returns the summary/rules, or undefined when missing', () => {
		const service = serviceWithBase();

		expect(service.getGameLocalisation('g_1')).toEqual({ summary: 'Air hockey.', rules: 'First to 5.' });
		expect(service.getGameLocalisation('nope')).toBeUndefined();
	});

	it('getNavLinks returns the configured links', () => {
		expect(serviceWithBase().getNavLinks()).toEqual(config.layout.navLinks);
	});
});
