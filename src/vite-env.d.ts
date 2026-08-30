/// <reference types="vite/client" />

import { type DataSource } from './enums/config';

declare global {
	interface ImportMetaEnv {
		/** Which source the app fetches the dataset from. Defaults to {@link DataSource.Local}. */
		readonly VITE_DATA_SOURCE?: DataSource;
		/**
		 * Base URL of the GCS public bucket (images, icons, configs). Exposed to the browser
		 * because image URLs and prod config fetches are built client-side,
		 */
		readonly VITE_GCS_PUBLIC_BASE_URL?: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}
