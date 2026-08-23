# MasterScoreService Example Implementation

This example shows how MasterScoreService combines pure data extraction methods with React Query hook methods, giving components a single API surface for fetching data.

```typescript
import { useQuery } from '@tanstack/react-query';

class MasterScoreService {
  // Pure extraction methods (testable, reusable)
  getAllTimeRankings(data: SuperstarsData) {
    return data.rankings.overall.allTime;
  }
  
  getYearRankings(data: SuperstarsData, year: number) {
    return data.rankings.overall.byYear[year];
  }
  
  getYearChampions(data: SuperstarsData, year: number) {
    return data.rankings.overall.champions.find(c => c.year === year);
  }
  
  getAllGames(data: SuperstarsData) {
    return Object.values(data.entities.games);
  }
  
  getGameById(data: SuperstarsData, id: string) {
    return data.entities.games[id];
  }
  
  getGameRankings(data: SuperstarsData, gameId: string) {
    return data.rankings.byGame[gameId]?.allTime;
  }
  
  getGameYearRankings(data: SuperstarsData, gameId: string, year: number) {
    return data.rankings.byGame[gameId]?.byYear[year];
  }
  
  getPlayerById(data: SuperstarsData, id: string) {
    return data.entities.players[id];
  }
  
  // Hook methods (components call these directly)
  useAllTimeRankings() {
    return useQuery({
      queryKey: ['masterScores'],
      queryFn: () => this.fetchData(),
      select: (data) => this.getAllTimeRankings(data),
    });
  }
  
  useYearRankings(year: number) {
    return useQuery({
      queryKey: ['masterScores', 'year', year],
      queryFn: () => this.fetchData(),
      select: (data) => this.getYearRankings(data, year),
    });
  }
  
  useYearChampions(year: number) {
    return useQuery({
      queryKey: ['masterScores', 'champions', year],
      queryFn: () => this.fetchData(),
      select: (data) => this.getYearChampions(data, year),
    });
  }
  
  useAllGames() {
    return useQuery({
      queryKey: ['masterScores'],
      queryFn: () => this.fetchData(),
      select: (data) => this.getAllGames(data),
    });
  }
  
  useGame(gameId: string) {
    return useQuery({
      queryKey: ['masterScores', 'game', gameId],
      queryFn: () => this.fetchData(),
      select: (data) => this.getGameById(data, gameId),
    });
  }
  
  useGameRankings(gameId: string) {
    return useQuery({
      queryKey: ['masterScores', 'game', gameId, 'rankings'],
      queryFn: () => this.fetchData(),
      select: (data) => this.getGameRankings(data, gameId),
    });
  }
  
  useGameYearRankings(gameId: string, year: number) {
    return useQuery({
      queryKey: ['masterScores', 'game', gameId, 'year', year],
      queryFn: () => this.fetchData(),
      select: (data) => this.getGameYearRankings(data, gameId, year),
    });
  }
  
  usePlayer(playerId: string) {
    return useQuery({
      queryKey: ['masterScores', 'player', playerId],
      queryFn: () => this.fetchData(),
      select: (data) => this.getPlayerById(data, playerId),
    });
  }
  
  // Internal fetch method
  private async fetchData(): Promise<SuperstarsData> {
    const dataSource = import.meta.env.VITE_DATA_SOURCE;
    const url = dataSource === 'local' 
      ? '/data/master-scores.json'
      : '/api/data';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.json();
  }
}

export const masterScoreService = new MasterScoreService();
```

## Component Usage

```typescript
import { masterScoreService } from '../services/MasterScoreService';

function AllTimeRankings() {
  const { data: rankings, isLoading, error } = masterScoreService.useAllTimeRankings();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <Table>
      {rankings.map(ranking => (
        <TableRow key={ranking.playerId}>
          <TableCell>{ranking.rank}</TableCell>
          <TableCell>{ranking.playerId}</TableCell>
          <TableCell>{ranking.score}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

## Key Benefits

1. **Single API surface**: Components only interact with `masterScoreService`
2. **Testable**: Pure methods can be tested independently without React Query
3. **Efficient**: React Query caches the full dataset, `select` extracts only what's needed
4. **Type-safe**: TypeScript ensures correct data shapes
5. **Automatic state management**: React Query handles loading, error, and caching
