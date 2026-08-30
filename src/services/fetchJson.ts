import { type DataLoadResource } from '../enums/errors';
import { type DataLoadError, fetchError } from './loadErrors';

/**
 * Returns a `(url) => Promise<T>` fetcher that requests `url` and parses the JSON body.
 * On a network failure or a non-OK response it throws an instance of `ErrorCtor` carrying
 * a {@link fetchError} for the given `resource`. Lets the dataset and config fetchers share
 * one implementation while each throws its own error type; the caller narrows/validates the
 * parsed body (hence the `unknown` default).
 *
 * @param resource - What is being loaded (names the resource in the error message).
 * @param ErrorCtor - The error class to throw (e.g. `MasterScoresError`, `ConfigError`).
 */
export const jsonFetcher = <T = unknown>(
	resource: DataLoadResource,
	ErrorCtor: new (errors: DataLoadError[]) => Error,
) => async (url: string): Promise<T> => {
	let response: Response;
	try {
		response = await fetch(url);
	} catch (cause) {
		throw new ErrorCtor([fetchError(resource, url, cause instanceof Error ? cause.message : String(cause))]);
	}

	if (!response.ok) {
		throw new ErrorCtor([fetchError(resource, url, `${response.status} ${response.statusText}`)]);
	}

	return response.json();
};
