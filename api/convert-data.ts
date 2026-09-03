import type { IncomingMessage, ServerResponse } from 'node:http';

import { Storage } from '@google-cloud/storage';

import { SOURCE_FILE_NAME } from '../lib/consts.js';
import { convertMasterScoresToJson } from '../lib/convertMasterScores.js';
import { isConversionErrors } from '../shared/types.js';
import { CACHE_CONTROL } from './consts.js';
import { type ApiErrors, sourceUnavailableError, unexpectedError } from './errors.js';

/** The spreadsheet's object path inside the private GCS bucket. */
const SPREADSHEET_OBJECT = `spreadsheet/${SOURCE_FILE_NAME}`;

/** Serialises `body` as a JSON response with the given status and optional cache header. */
const sendJson = (res: ServerResponse, status: number, body: unknown, cacheControl?: string): void => {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json');
	if (cacheControl) res.setHeader('Cache-Control', cacheControl);
	res.end(JSON.stringify(body));
};

/** Downloads the Master Scores spreadsheet from the private bucket into a Buffer. */
const downloadSpreadsheet = async (): Promise<Buffer> => {
	const bucket = process.env.GCS_PRIVATE_BUCKET;
	const serviceAccountKey = process.env.GCS_SERVICE_ACCOUNT_KEY;

	if (!bucket || !serviceAccountKey) {
		console.error('Missing required GCS env vars: GCS_PRIVATE_BUCKET and/or GCS_SERVICE_ACCOUNT_KEY');
		throw new Error('Server is not configured to load data');
	}

	const storage = new Storage({ credentials: JSON.parse(serviceAccountKey) });
	const [buffer] = await storage.bucket(bucket).file(SPREADSHEET_OBJECT).download();

	return buffer;
};

/**
 * Production wrapper around the pure conversion logic.
 *
 * Fetches the spreadsheet from the private GCS bucket, runs it through
 * `convertMasterScoresToJson`, and returns the JSON directly (no file storage).
 * This is the endpoint the app fetches in production (`VITE_DATA_SOURCE=api` →
 * `/api/convert-data`).
 */
export default async (_req: IncomingMessage, res: ServerResponse): Promise<void> => {
	try {
		let buffer: Buffer;
		try {
			buffer = await downloadSpreadsheet();
		} catch (cause) {
			console.error('Failed to load spreadsheet from GCS:', cause);
			const errors: ApiErrors = { errors: [sourceUnavailableError(cause)] };
			sendJson(res, 500, errors);
			return;
		}

		const result = convertMasterScoresToJson(buffer);

		if (isConversionErrors(result)) {
			sendJson(res, 200, result);
			return;
		}

		sendJson(res, 200, result, CACHE_CONTROL);
	} catch (cause) {
		// Anything past the download — e.g. an unexpected throw from the converter —
		// is caught here so the endpoint returns a logged JSON 500 instead of a
		// FUNCTION_INVOCATION_FAILED.
		console.error('Unexpected error in /api/convert-data:', cause);
		if (!res.headersSent) {
			const errors: ApiErrors = { errors: [unexpectedError(cause)] };
			sendJson(res, 500, errors);
		}
	}
};
