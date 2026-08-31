/**
 * Enums for the API layer (`api/`). These describe failures at the I/O boundary
 * (fetching the spreadsheet).
 */

/** Machine-readable codes for API-layer failures in the data endpoint (`api/convert-data.ts`). */
export enum ApiErrorCode {
	SourceUnavailable = 'SOURCE_UNAVAILABLE',
}
