/** Runs `fn`, returning whatever it throws (so assertions stay out of the catch). */
export const captureError = (fn: () => void): unknown => {
	try {
		fn();
	} catch (error) {
		return error;
	}
	return undefined;
};
