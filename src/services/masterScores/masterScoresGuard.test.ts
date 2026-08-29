import { DataLoadErrorCode } from './dataLoadErrors';
import { assertSuperstarsData, MasterScoresError } from './masterScoresGuard';
import { sampleData } from './testFixtures';

/** Runs `fn`, returning whatever it throws (so assertions stay out of the catch). */
const captureError = (fn: () => void): unknown => {
	try {
		fn();
	} catch (error) {
		return error;
	}
	return undefined;
};

describe('assertSuperstarsData', () => {
	it('returns the data unchanged for a well-shaped payload', () => {
		expect(assertSuperstarsData(sampleData)).toBe(sampleData);
	});

	it('throws MasterScoresError for a non-object payload', () => {
		expect(() => assertSuperstarsData('nope')).toThrow(MasterScoresError);
		expect(() => assertSuperstarsData(null)).toThrow(MasterScoresError);
	});

	it('throws when a top-level section is missing', () => {
		const withoutRankings = { metadata: sampleData.metadata, entities: sampleData.entities };
		expect(() => assertSuperstarsData(withoutRankings)).toThrow(MasterScoresError);
	});

	it('throws when rankings.overall is malformed', () => {
		const malformed = {
			...sampleData,
			rankings: { ...sampleData.rankings, overall: { allTime: [], byYear: {} } },
		};
		expect(() => assertSuperstarsData(malformed)).toThrow(MasterScoresError);
	});

	it('carries a DataLoadError describing the mismatch', () => {
		const error = captureError(() => assertSuperstarsData({}));
		expect(error).toBeInstanceOf(MasterScoresError);
		if (!(error instanceof MasterScoresError)) return;
		expect(error.errors[0].code).toBe(DataLoadErrorCode.InvalidDataShape);
	});
});
