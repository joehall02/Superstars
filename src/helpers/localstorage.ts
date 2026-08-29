export const setLocalStorageItem = (key: string, value: string): void => {
	localStorage.setItem(key, value);
};

export const getLocalStorageItem = <T = unknown>(key: string, defaultValue: T): T => {
	return localStorage.getItem(key) as T ?? defaultValue;
};
