/**
 * Shared data-load errors — failures that happen while fetching and validating JSON
 * (the dataset or the config) in the browser. The `resource` argument names what
 * failed, so both the Superstars data and the config layers produce consistent,
 * machine-readable errors.
 */

import { type ConversionError } from '../../shared/types';
import { DataLoadErrorCode, type DataLoadResource } from '../enums/errors';

export interface DataLoadError {
	code: DataLoadErrorCode;
	message: string;
	context?: Record<string, unknown>;
}

/**
 * A resource could not be fetched — the source was unreachable or returned a
 * non-OK response.
 *
 * @param resource - What was being loaded.
 * @param url - The URL that was requested.
 * @param detail - Human-readable cause (network message or HTTP status).
 * @returns The FETCH_FAILED data-load error.
 */
export const fetchError = (resource: DataLoadResource, url: string, detail: string): DataLoadError => ({
	code: DataLoadErrorCode.FetchFailed,
	message: `Could not load ${resource} from ${url}: ${detail}`,
	context: { url, detail },
});

/**
 * The fetched JSON was reached and parsed but did not match the expected shape.
 *
 * @param resource - What was being loaded.
 * @param detail - Which part of the shape was missing or malformed.
 * @returns The INVALID_DATA_SHAPE data-load error.
 */
export const invalidShapeError = (resource: DataLoadResource, detail: string): DataLoadError => ({
	code: DataLoadErrorCode.InvalidDataShape,
	message: `Fetched ${resource} did not match the expected shape: ${detail}`,
	context: { detail },
});

/**
 * Returns a `(detail) => never` function that a shape guard calls when the payload is
 * malformed. It throws an instance of `ErrorCtor` carrying an {@link invalidShapeError}
 * for the given `resource`. Lets `assertSuperstarsData` and `assertAppConfig` share one
 * rejecter while each throws its own error type.
 *
 * @param resource - What was being validated (names the resource in the error message).
 * @param ErrorCtor - The error class to throw (e.g. `MasterScoresError`, `ConfigError`).
 */
export const invalidShapeThrower = (
	resource: DataLoadResource,
	ErrorCtor: new (errors: DataLoadError[]) => Error,
) => (detail: string): never => {
	throw new ErrorCtor([invalidShapeError(resource, detail)]);
};

/**
 * Thrown when the dataset cannot be loaded or fails validation. Carries the underlying
 * errors — converter-origin {@link ConversionError}s (via the fetch passthrough) or
 * frontend {@link DataLoadError}s — so the Error Page can render machine-readable details.
 */
export class MasterScoresError extends Error {
	readonly errors: Array<ConversionError | DataLoadError>;

	constructor(errors: Array<ConversionError | DataLoadError>, message?: string) {
		super(message ?? errors[0]?.message ?? 'Failed to load Superstars data');
		this.name = 'MasterScoresError';
		this.errors = errors;
	}
}

/**
 * Thrown when the config cannot be loaded or fails validation. Carries the underlying
 * {@link DataLoadError}s so the Error Page can render machine-readable details — the
 * config counterpart to {@link MasterScoresError}.
 */
export class ConfigError extends Error {
	readonly errors: DataLoadError[];

	constructor(errors: DataLoadError[], message?: string) {
		super(message ?? errors[0]?.message ?? 'Failed to load config');
		this.name = 'ConfigError';
		this.errors = errors;
	}
}
