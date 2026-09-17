/**
 * Tests for the production data endpoint (`api/convert-data.ts`).
 *
 * This handler wraps the pure converter with GCS I/O, so these tests cover the
 * boundary the converter's own tests can't reach: a missing/misconfigured or
 * unreachable source (SOURCE_UNAVAILABLE, 500), the success path (200 + long-lived
 * cache header), and the conversion-error passthrough (200, no cache header).
 *
 * `@google-cloud/storage` and the converter are mocked, so no real bucket or `.xlsx`
 * bytes are needed — the download and conversion outcomes are driven per test.
 */

import { ConversionErrorCode } from '../shared/enums';
import { type ConversionErrors, type SuperstarsData } from '../shared/types';
import { CACHE_CONTROL } from './consts';
import type * as ConvertDataModule from './convert-data';
import { ApiErrorCode } from './enums';
import { type ApiErrors } from './errors';

// Re-imported fresh per test (see `beforeEach`) so the module-scope warm-instance
// memo starts empty each time and can't leak a cached result across cases.
let handler: ConvertDataModule['default'];

// `vi.hoisted` so these mocks exist before the (hoisted) `vi.mock` factories run.
const { mockDownload, mockConvert } = vi.hoisted(() => ({
	mockDownload: vi.fn(),
	mockConvert: vi.fn(),
}));

vi.mock('@google-cloud/storage', () => ({
	// A class so `new Storage(...)` is constructable; `download` is swapped per test.
	Storage: class {
		bucket() {
			return { file: () => ({ download: mockDownload }) };
		}
	},
}));

vi.mock('../lib/convertMasterScores', () => ({ convertMasterScoresToJson: mockConvert }));

// Minimal stand-in for `ServerResponse`: the handler only sets `statusCode`, calls
// `setHeader`, and `end`s a JSON string (see `sendJson`). Captures each so tests
// can assert on the status, headers, and parsed body.
const makeResponse = () => {
	const res = {
		statusCode: 0,
		headers: {} as Record<string, string>,
		body: undefined as unknown,
		setHeader(name: string, value: string) {
			res.headers[name] = value;
		},
		end(chunk: string) {
			res.body = JSON.parse(chunk);
		},
	};
	return res;
};

// The handler ignores the request, so pass an empty stand-in.
const invoke = (res: ReturnType<typeof makeResponse>): Promise<void> =>
	handler({} as Parameters<typeof handler>[0], res as unknown as Parameters<typeof handler>[1]);

// Routing-only stand-ins: the handler forwards the converter's output verbatim and
// never inspects it beyond `isConversionErrors` (which keys off an `errors` field).
const fakeData = { sentinel: 'data' } as unknown as SuperstarsData;
const fakeErrors: ConversionErrors = { errors: [{ code: ConversionErrorCode.MissingSheet, message: 'nope' }] };

beforeEach(async () => {
	// Fresh module → empty memo. The hoisted mocks keep their identity across the
	// reset, so the re-imported handler still talks to the same GCS/converter stubs.
	vi.resetModules();
	({ default: handler } = await import('./convert-data'));
	mockDownload.mockReset();
	mockConvert.mockReset();
	vi.stubEnv('GCS_PRIVATE_BUCKET', 'test-bucket');
	vi.stubEnv('GCS_SERVICE_ACCOUNT_KEY', '{}');
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('api/convert-data — source failures', () => {
	test('returns 500 + SOURCE_UNAVAILABLE when GCS env vars are missing', async () => {
		vi.stubEnv('GCS_PRIVATE_BUCKET', '');
		const res = makeResponse();

		await invoke(res);

		expect(res.statusCode).toBe(500);
		expect(res.body).toEqual({
			errors: [expect.objectContaining({ code: ApiErrorCode.SourceUnavailable })],
		});
		// Bailed before touching GCS.
		expect(mockDownload).not.toHaveBeenCalled();
	});

	test('returns 500 + SOURCE_UNAVAILABLE when the GCS download throws', async () => {
		mockDownload.mockRejectedValue(new Error('boom'));
		const res = makeResponse();

		await invoke(res);

		expect(res.statusCode).toBe(500);
		const body = res.body as ApiErrors;
		expect(body.errors[0].code).toBe(ApiErrorCode.SourceUnavailable);
		// The underlying cause must not leak onto the wire (error hygiene).
		expect(body.errors[0]).not.toHaveProperty('context');
		// The converter is never reached when the bytes never arrive.
		expect(mockConvert).not.toHaveBeenCalled();
	});

	test('does not set a cache header on the failure response', async () => {
		mockDownload.mockRejectedValue(new Error('boom'));
		const res = makeResponse();

		await invoke(res);

		expect(res.headers['Cache-Control']).toBeUndefined();
	});
});

describe('api/convert-data — success', () => {
	beforeEach(() => {
		mockDownload.mockResolvedValue([Buffer.from('xlsx')]);
		mockConvert.mockReturnValue(fakeData);
	});

	test('returns 200 with the converted SuperstarsData', async () => {
		const res = makeResponse();

		await invoke(res);

		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ sentinel: 'data' });
		expect(mockConvert).toHaveBeenCalledOnce();
	});

	test('sets the long-lived cache-control header on success', async () => {
		const res = makeResponse();

		await invoke(res);

		expect(res.headers['Cache-Control']).toBe(CACHE_CONTROL);
	});
});

describe('api/convert-data — conversion errors', () => {
	test('passes a ConversionErrors payload through as 200 without a cache header', async () => {
		mockDownload.mockResolvedValue([Buffer.from('xlsx')]);
		mockConvert.mockReturnValue(fakeErrors);
		const res = makeResponse();

		await invoke(res);

		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual(fakeErrors);
		expect(res.headers['Cache-Control']).toBeUndefined();
	});
});

describe('api/convert-data — warm-instance memo', () => {
	beforeEach(() => {
		mockDownload.mockResolvedValue([Buffer.from('xlsx')]);
		mockConvert.mockReturnValue(fakeData);
	});

	test('serves a second request from the memo without re-downloading or re-parsing', async () => {
		const first = makeResponse();
		await invoke(first);
		const second = makeResponse();
		await invoke(second);

		expect(second.statusCode).toBe(200);
		expect(second.body).toEqual({ sentinel: 'data' });
		// The download + parse ran once; the second hit came from the memo.
		expect(mockDownload).toHaveBeenCalledOnce();
		expect(mockConvert).toHaveBeenCalledOnce();
	});

	test('does not memoise a failed download — the next request retries', async () => {
		mockDownload.mockRejectedValueOnce(new Error('boom'));

		const first = makeResponse();
		await invoke(first);
		expect(first.statusCode).toBe(500);

		const second = makeResponse();
		await invoke(second);

		expect(second.statusCode).toBe(200);
		expect(second.body).toEqual({ sentinel: 'data' });
		// A second download happened because the failure was never cached.
		expect(mockDownload).toHaveBeenCalledTimes(2);
	});
});
