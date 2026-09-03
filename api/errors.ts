/**
 * API-layer error factories and shapes for the data endpoint (`api/convert-data.ts`).
 *
 * These are I/O-boundary failures that happen *before* conversion — the spreadsheet
 * could not be fetched from its source — so they live here rather than in
 * `lib/errors.ts` (spreadsheet-content conversion failures).
 */

import { ApiErrorCode } from './enums.js';

export interface ApiError {
	code: ApiErrorCode;
	message: string;
	/** Machine-readable details for the error screen. */
	context?: Record<string, unknown>;
}

/** Returned as the error body when the endpoint fails before/around conversion. */
export interface ApiErrors {
	errors: ApiError[];
}

/**
 * The spreadsheet could not be fetched from its source (the private GCS bucket) —
 * the object was unreachable or the server is misconfigured. Distinct from a parse
 * failure: the bytes never arrived, so there was nothing to convert.
 *
 * @param cause - The underlying download/configuration failure.
 * @returns The SOURCE_UNAVAILABLE API error.
 */
export const sourceUnavailableError = (cause: unknown): ApiError => ({
	code: ApiErrorCode.SourceUnavailable,
	message: 'The data source could not be reached — the spreadsheet could not be loaded.',
	context: { cause: cause instanceof Error ? cause.message : String(cause) },
});

/**
 * An unexpected failure occurred *after* the spreadsheet loaded — e.g. the
 * converter threw. Distinct from {@link sourceUnavailableError}: the bytes
 * arrived, but processing them crashed. Catching this keeps the endpoint from
 * failing as an opaque `FUNCTION_INVOCATION_FAILED`.
 *
 * @param cause - The underlying error.
 * @returns The UNEXPECTED_ERROR API error.
 */
export const unexpectedError = (cause: unknown): ApiError => ({
	code: ApiErrorCode.Unexpected,
	message: 'An unexpected error occurred while preparing the data.',
	context: { cause: cause instanceof Error ? cause.message : String(cause) },
});
