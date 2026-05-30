import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define Interfaces based on C# DTOs
export interface Player {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreatePlayerDto {
  name: string;
}

export interface Game {
  id: string;
  name: string;
  createdAt: string;
  finishedAt?: string;
  isFinished: boolean;
  players: GamePlayer[];
}

export interface GamePlayer {
  id: string;
  playerId: string;
  playerName: string;
  seatOrder: number;
}

export interface Round {
  id: string;
  gameId: string;
  roundNumber: number;
  cardsCount: number;
  createdAt: string;
  isCompleted: boolean;
  scores: RoundScore[];
}

export interface RoundScore {
  id: string;
  gamePlayerId: string;
  playerId: string;
  playerName: string;
  predictedTricks: number;
  actualTricks?: number;
  points?: number;
  updatedAt: string;
}

export interface PredictionEntry {
  gamePlayerId: string;
  predictedTricks: number;
}

export interface ResultEntry {
  gamePlayerId: string;
  actualTricks: number;
}

export interface Scoreboard {
  gameId: string;
  gameName: string;
  createdAt: string;
  finishedAt?: string;
  isFinished: boolean;
  playerSummaries: PlayerScoreSummary[];
  roundsTable: RoundTableRow[];
}

export interface PlayerScoreSummary {
  playerId: string;
  gamePlayerId: string;
  playerName: string;
  seatOrder: number;
  totalPoints: number;
  roundsPlayed: number;
  exactPredictions: number;
  totalPredictedTricks: number;
  totalActualTricks: number;
  predictionAccuracyPercentage: number;
}

export interface RoundTableRow {
  roundId: string;
  roundNumber: number;
  cardsCount: number;
  isCompleted: boolean;
  playerCells: RoundScoreCell[];
}

export interface RoundScoreCell {
  gamePlayerId: string;
  playerId: string;
  predictedTricks: number;
  actualTricks?: number;
  points?: number;
}

export interface AllTimeStats {
  totalGames: number;
  totalRounds: number;
  totalPlayers: number;
  rankingByTotalPoints: PlayerPointRanking[];
  rankingByAveragePoints: PlayerAverageRanking[];
  playerWithMostExactPredictions?: PlayerStatDetail;
  playerWithBestPredictionAccuracy?: PlayerAccuracyDetail;
  playerWithMostOverpredictions?: PlayerStatDetail;
  playerWithMostUnderpredictions?: PlayerStatDetail;
  biggestSingleRoundScore?: SingleRoundScoreDetail;
  worstSingleRoundScore?: SingleRoundScoreDetail;
}

export interface PlayerPointRanking {
  playerId: string;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
}

export interface PlayerAverageRanking {
  playerId: string;
  playerName: string;
  averagePoints: number;
  roundsPlayed: number;
}

export interface PlayerStatDetail {
  playerId: string;
  playerName: string;
  count: number;
}

export interface PlayerAccuracyDetail {
  playerId: string;
  playerName: string;
  accuracyPercentage: number;
  roundsPlayed: number;
}

export interface SingleRoundScoreDetail {
  playerId: string;
  playerName: string;
  gameId: string;
  gameName: string;
  roundNumber: number;
  points: number;
  predictedTricks: number;
  actualTricks: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  // Default to relative /api which uses proxy locally and path mapping in prod
  private baseUrl = '/api';

  // --- Players ---
  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.baseUrl}/players`);
  }

  getPlayer(id: string): Observable<Player> {
    return this.http.get<Player>(`${this.baseUrl}/players/${id}`);
  }

  createPlayer(name: string): Observable<Player> {
    return this.http.post<Player>(`${this.baseUrl}/players`, { name });
  }

  updatePlayer(id: string, name: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/players/${id}`, { name });
  }

  deletePlayer(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/players/${id}`);
  }

  // --- Games ---
  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.baseUrl}/games`);
  }

  getGame(id: string): Observable<Game> {
    return this.http.get<Game>(`${this.baseUrl}/games/${id}`);
  }

  createGame(name: string): Observable<Game> {
    return this.http.post<Game>(`${this.baseUrl}/games`, { name });
  }

  addPlayerToGame(gameId: string, playerId: string, seatOrder: number): Observable<GamePlayer> {
    return this.http.post<GamePlayer>(`${this.baseUrl}/games/${gameId}/players`, { playerId, seatOrder });
  }

  removePlayerFromGame(gameId: string, playerId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/games/${gameId}/players/${playerId}`);
  }

  createRound(gameId: string, cardsCount: number): Observable<Round> {
    return this.http.post<Round>(`${this.baseUrl}/games/${gameId}/rounds`, { cardsCount });
  }

  getScoreboard(gameId: string): Observable<Scoreboard> {
    return this.http.get<Scoreboard>(`${this.baseUrl}/games/${gameId}/scoreboard`);
  }

  finishGame(gameId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/games/${gameId}/finish`, {});
  }

  // --- Rounds ---
  getRound(id: string): Observable<Round> {
    return this.http.get<Round>(`${this.baseUrl}/rounds/${id}`);
  }

  submitPredictions(roundId: string, predictions: PredictionEntry[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/rounds/${roundId}/predictions`, { predictions });
  }

  submitResults(roundId: string, results: ResultEntry[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/rounds/${roundId}/results`, { results });
  }

  completeRound(roundId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/rounds/${roundId}/complete`, {});
  }

  // --- Stats ---
  getAllTimeStats(): Observable<AllTimeStats> {
    return this.http.get<AllTimeStats>(`${this.baseUrl}/stats/alltime`);
  }

  getPlayerStats(playerId: string): Observable<PlayerAccuracyDetail> {
    return this.http.get<PlayerAccuracyDetail>(`${this.baseUrl}/stats/players/${playerId}`);
  }

  // --- Seed ---
  seedDemoData(): Observable<any> {
    return this.http.post(`${this.baseUrl}/seed`, {});
  }
}
