/** Narrows an unknown value to a plain object, so its keys can be safely inspected. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;
