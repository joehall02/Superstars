import type { IncomingMessage, ServerResponse } from 'node:http';

import { Storage } from '@google-cloud/storage';

import { SOURCE_FILE_NAME } from '../lib/consts';
import { convertMasterScoresToJson } from '../lib/convertMasterScores';
import { isConversionErrors } from '../shared/types';

/** The spreadsheet's object path inside the private GCS bucket. */
const SPREADSHEET_OBJECT = `spreadsheet/${SOURCE_FILE_NAME}`;

/**
 * Data changes at most yearly, so cache hard at the CDN edge (`s-maxage`), which a
 * redeploy/purge can bust. `max-age=0` forces browsers to revalidate every load so
 * they never serve a stale copy we can't control; `stale-while-revalidate` lets the
 * edge serve instantly while refreshing in the background.
 */
const CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';

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
	let buffer: Buffer;
	try {
		buffer = await downloadSpreadsheet();
	} catch (cause) {
		console.error('Failed to load spreadsheet from GCS:', cause);
		sendJson(res, 500, { error: 'Failed to load data' });
		return;
	}

	const result = convertMasterScoresToJson(buffer);

	if (isConversionErrors(result)) {
		sendJson(res, 200, result);
		return;
	}

	sendJson(res, 200, result, CACHE_CONTROL);
};
