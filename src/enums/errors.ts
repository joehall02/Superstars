/** Machine-readable codes for frontend data-load failures (fetching + validating JSON). */
export enum DataLoadErrorCode {
	FetchFailed = 'FETCH_FAILED',
	InvalidDataShape = 'INVALID_DATA_SHAPE',
}

/** What was being loaded when a data-load error occurred — interpolated into error messages. */
export enum DataLoadResource {
	SuperstarsData = 'Superstars data',
	Config = 'config',
}
