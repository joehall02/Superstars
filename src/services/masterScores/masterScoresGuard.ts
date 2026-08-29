import { type ConversionError, type SuperstarsData } from '../../../shared/types';
import { type DataLoadError, invalidDataShapeError } from './dataLoadErrors';

/**
 * Thrown when the dataset cannot be loaded or fails validation.
 *
 * Carries the underlying errors — converter-origin {@link ConversionError}s (via the
 * fetch passthrough) or frontend {@link DataLoadError}s — so the Error Page can
 * render machine-readable details rather than a bare message.
 */
export class MasterScoresError extends Error {
	readonly errors: Array<ConversionError | DataLoadError>;

	constructor(errors: Array<ConversionError | DataLoadError>, message?: string) {
		super(message ?? errors[0]?.message ?? 'Failed to load Superstars data');
		this.name = 'MasterScoresError';
		this.errors = errors;
	}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

/**
 * Pragmatic top-level shape guard for a fetched dataset. It checks the structural
 * skeleton the app relies on — not every row — so a malformed payload fails fast
 * with a {@link MasterScoresError} instead of surfacing as a confusing runtime
 * error deep inside a component.
 */
export const assertSuperstarsData = (json: unknown): SuperstarsData => {
	const invalid = (detail: string): never => {
		throw new MasterScoresError([invalidDataShapeError(detail)]);
	};

	if (!isRecord(json)) return invalid('response is not an object');

	const { metadata, entities, rankings } = json;

	if (!metadata) invalid('missing metadata');

	if (!isRecord(entities) || !entities.players || !entities.games) {
		invalid('missing entities.players / entities.games');
	}

	if (!isRecord(rankings)) return invalid('missing rankings');

	const { overall, byGame } = rankings;
	if (
		!isRecord(overall) ||
		!Array.isArray(overall.allTime) ||
		!overall.byYear ||
		!Array.isArray(overall.champions)
	) {
		invalid('missing rankings.overall.{allTime,byYear,champions}');
	}

	if (!byGame) invalid('missing rankings.byGame');

	return json as unknown as SuperstarsData;
};
