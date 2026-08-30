import { useContext } from 'react';

import { ConfigContext } from '../context/configContext';
import { type StatType } from '../enums/config';
import type { ConfigService, GameLocalisation, NavLink, StatLabels } from '../types/config.types';

/**
 * Access the loaded {@link ConfigService}. The provider gates render until config is
 * loaded, so this returns a ready-to-use service synchronously — no loading state.
 */
export const useConfig = (): ConfigService => {
	const context = useContext(ConfigContext);

	if (!context) {
		throw new Error('useConfig must be used within a ConfigProvider');
	}

	return context;
};

/** Thin per-slice hooks over {@link useConfig}. */

export const useGameImage = (gameId: string): string | undefined => useConfig().getGameImage(gameId);

export const useGameIcon = (gameId: string): string | undefined => useConfig().getGameIcon(gameId);

export const usePlayerIcon = (playerId: string): string | undefined => useConfig().getPlayerIcon(playerId);

export const useGameLocalisation = (gameId: string): GameLocalisation | undefined =>
	useConfig().getGameLocalisation(gameId);

export const useStatLabels = (gameId: string, type: StatType): StatLabels => useConfig().getStatLabels(gameId, type);

export const useOverallStatLabels = (type: StatType): StatLabels => useConfig().getOverallStatLabels(type);

export const useNavLinks = (): NavLink[] => useConfig().getNavLinks();
