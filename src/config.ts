export enum DataSource {
	Local = 'local',
	Api = 'api',
}

export const DATA_SOURCE_URLS: Record<DataSource, string> = {
	[DataSource.Local]: '/data/master-scores.json',
	[DataSource.Api]: '/api/data',
};
