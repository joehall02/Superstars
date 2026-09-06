export enum StatType {
	AllTime = 'allTime',
	ByYear = 'byYear',
}

/** Sort direction for a sortable table column. */
export enum SortDirection {
	Asc = 'asc',
	Desc = 'desc',
}

/** Where the app fetches the dataset from. */
export enum DataSource {
	Local = 'local',
	Api = 'api',
}

/** The config JSON files fetched at startup. */
export enum ConfigFile {
	Images = 'images.json',
	Localisation = 'localisation.json',
	Stats = 'stats.json',
	Layout = 'layout.json',
}
