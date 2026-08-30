import { DataLoadErrorCode } from '../../../enums/errors';
import { captureError } from '../../../helpers/tests';
import { ConfigError } from '../../loadErrors';
import { assertAppConfig } from '../configsGuard';

/** Minimal payload that satisfies every skeleton check (empty collections are valid). */
const validConfig = {
	images: { games: {}, players: {} },
	localisation: { games: {} },
	stats: { statGroups: {}, games: {}, overall: {} },
	layout: { navLinks: [] },
};

describe('assertAppConfig', () => {
	it('returns the config unchanged for a well-shaped payload', () => {
		expect(assertAppConfig(validConfig)).toBe(validConfig);
	});

	it('throws ConfigError when images is missing games/players', () => {
		expect(() => assertAppConfig({ ...validConfig, images: {} })).toThrow(ConfigError);
		expect(() => assertAppConfig({ ...validConfig, images: null })).toThrow(ConfigError);
	});

	it('throws ConfigError when localisation.games is missing', () => {
		expect(() => assertAppConfig({ ...validConfig, localisation: {} })).toThrow(ConfigError);
	});

	it('throws ConfigError when a stats section is missing', () => {
		expect(() => assertAppConfig({ ...validConfig, stats: { statGroups: {}, games: {} } })).toThrow(ConfigError);
	});

	it('throws ConfigError when layout.navLinks is not an array', () => {
		expect(() => assertAppConfig({ ...validConfig, layout: { navLinks: {} } })).toThrow(ConfigError);
	});

	it('carries a DataLoadError describing the mismatch', () => {
		const error = captureError(() => assertAppConfig({ ...validConfig, layout: {} }));
		expect(error).toBeInstanceOf(ConfigError);
		if (!(error instanceof ConfigError)) return;
		expect(error.errors[0].code).toBe(DataLoadErrorCode.InvalidDataShape);
	});
});
