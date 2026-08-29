import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SOURCE_FILE_NAME } from '../lib/consts';
import { convertMasterScoresToJson } from '../lib/convertMasterScores';
import { isConversionErrors } from '../shared/types';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(scriptDir, '..', 'data');
const publicDataDir = join(scriptDir, '..', 'public', 'data');

const inputPath = join(dataDir, SOURCE_FILE_NAME);
const outputPath = join(publicDataDir, 'master-scores.json');

/**
 * Local development wrapper around the pure conversion logic.
 *
 * Reads the Master Scores spreadsheet from `data/`, runs it through
 * `convertMasterScoresToJson`, and writes the result to `public/data/master-scores.json`.
 * This is the JSON the app fetches in development and inside the Docker build
 * (`VITE_DATA_SOURCE=local`). 
 *
 * Run with `npm run convert-data`.
 */
const main = (): void => {
	let buffer: Buffer;
	try {
		buffer = readFileSync(inputPath);
	} catch (cause) {
		console.error(`Could not read spreadsheet at ${inputPath}`);
		console.error(cause instanceof Error ? cause.message : cause);
		process.exit(1);
	}

	const result = convertMasterScoresToJson(buffer);

	if (isConversionErrors(result)) {
		console.error(`Conversion failed with ${result.errors.length} error(s):`);
		for (const error of result.errors) {
			console.error(`  [${error.code}] ${error.message}`);
			if (error.context) console.error(`    ${JSON.stringify(error.context)}`);
		}
		process.exit(1);
	}

	writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

	const { totalPlayers, totalGames, availableYears } = result.metadata;
	console.log(`Wrote ${outputPath}`);
	console.log(`  ${totalPlayers} players, ${totalGames} games, years ${availableYears.join(', ')}`);
};

main();
