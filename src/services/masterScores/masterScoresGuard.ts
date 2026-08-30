import { type SuperstarsData } from '../../../shared/types';
import { DataLoadResource } from '../../enums/errors';
import { isRecord } from '../../helpers/typeGuards';
import { invalidShapeThrower, MasterScoresError } from '../loadErrors';

/**
 * Pragmatic top-level shape guard for a fetched dataset. It checks the structural
 * skeleton the app relies on — not every row — so a malformed payload fails fast
 * with a {@link MasterScoresError} instead of surfacing as a confusing runtime
 * error deep inside a component.
 */
export const assertSuperstarsData = (json: unknown): SuperstarsData => {
	const invalid = invalidShapeThrower(DataLoadResource.SuperstarsData, MasterScoresError);

	if (!isRecord(json)) return invalid('response is not an object');

	const { metadata, entities, rankings } = json;

	if (!metadata) invalid('missing metadata');

	if (!isRecord(entities) || !entities.players || !entities.games) {
		invalid('missing entities.players / entities.games');
	}

	if (!isRecord(rankings)) return invalid('missing rankings');

	const { overall, byGame } = rankings;
	if (
		!isRecord(overall) ||
		!Array.isArray(overall.allTime) ||
		!overall.byYear ||
		!Array.isArray(overall.champions)
	) {
		invalid('missing rankings.overall.{allTime,byYear,champions}');
	}

	if (!byGame) invalid('missing rankings.byGame');

	return json as unknown as SuperstarsData;
};
