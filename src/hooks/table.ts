import { useState } from 'react';

interface IYearNavigation {
	/** The year currently shown; undefined until the available years load. */
	activeYear: number | undefined;
	/** Handlers and boundary flags to spread onto a {@link YearNavigator}. */
	yearNavigator: {
		onPrevious: () => void;
		onNext: () => void;
		canGoPrevious: boolean;
		canGoNext: boolean;
	};
}

/**
 * Year-selection state shared by the Rankings and Game Details per-year tables: sorts the
 * available years, defaults to the latest until the user picks one, and exposes the
 * previous/next wiring for a {@link YearNavigator}. The caller fetches the rankings for the
 * returned {@link IYearNavigation.activeYear}, keeping this agnostic of overall vs per-game data.
 */
export const useYearNavigation = (availableYears: number[]): IYearNavigation => {
	const sortedYears = [...availableYears].sort((a, b) => a - b);
	const [selectedYear, setSelectedYear] = useState<number>();
	const activeYear = selectedYear ?? sortedYears.at(-1);
	const yearIndex = activeYear === undefined ? -1 : sortedYears.indexOf(activeYear);

	return {
		activeYear,
		yearNavigator: {
			onPrevious: () => setSelectedYear(sortedYears[yearIndex - 1]),
			onNext: () => setSelectedYear(sortedYears[yearIndex + 1]),
			canGoPrevious: yearIndex > 0,
			canGoNext: yearIndex >= 0 && yearIndex < sortedYears.length - 1,
		},
	};
};
