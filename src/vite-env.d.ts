/// <reference types="vite/client" />

import { type DataSource } from './config';

declare global {
	interface ImportMetaEnv {
		/** Which source the app fetches the dataset from. Defaults to {@link DataSource.Local}. */
		readonly VITE_DATA_SOURCE?: DataSource;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}
