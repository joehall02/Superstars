/**
 * Frontend data-load error factories — failures that happen while fetching and
 * validating the dataset in the browser.
 */

/** Machine-readable codes for frontend data-load failures. */
export enum DataLoadErrorCode {
	FetchFailed = 'FETCH_FAILED',
	InvalidDataShape = 'INVALID_DATA_SHAPE',
}

export interface DataLoadError {
	code: DataLoadErrorCode;
	message: string;
	context?: Record<string, unknown>;
}

/**
 * The dataset could not be fetched — the source was unreachable or returned a
 * non-OK response.
 *
 * @param url - The data source URL that was requested.
 * @param detail - Human-readable cause (network message or HTTP status).
 * @returns The FETCH_FAILED data-load error.
 */
export const dataFetchError = (url: string, detail: string): DataLoadError => ({
	code: DataLoadErrorCode.FetchFailed,
	message: `Could not load the Superstars data from ${url}: ${detail}`,
	context: { url, detail },
});

/**
 * The fetched JSON was reached and parsed but did not match the expected
 * `SuperstarsData` shape.
 *
 * @param detail - Which part of the shape was missing or malformed.
 * @returns The INVALID_DATA_SHAPE data-load error.
 */
export const invalidDataShapeError = (detail: string): DataLoadError => ({
	code: DataLoadErrorCode.InvalidDataShape,
	message: `Fetched Superstars data did not match the expected shape: ${detail}`,
	context: { detail },
});
