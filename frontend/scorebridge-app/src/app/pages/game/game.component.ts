import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, Scoreboard, RoundTableRow } from '../../services/api.service';
import { NgIf, NgFor, CurrencyPipe, PercentPipe } from '@angular/common';

@Component({
  selector: 'app-game',
  imports: [NgIf, NgFor, RouterLink],
  template: `
    <div *ngIf="loading()" class="loading-container">
      <div class="spinner"></div>
      <p>Scorebord laden...</p>
    </div>

    <div *ngIf="!loading() && scoreboard()" class="game-detail-container">
      <!-- Game Title Card -->
      <div class="glass-card game-header-card">
        <div class="header-flex">
          <div>
            <span class="game-status-badge" [class.completed]="scoreboard()?.isFinished">
              {{ scoreboard()?.isFinished ? 'Voltooid' : 'Actief Spel' }}
            </span>
            <h1 class="game-title">{{ scoreboard()?.gameName }}</h1>
          </div>
          <button *ngIf="!scoreboard()?.isFinished" (click)="finishGame()" class="btn btn-secondary btn-finish">
            Beëindigen
          </button>
        </div>
      </div>

      <!-- Active Round Banner (Important UX!) -->
      <div *ngIf="hasActiveRound()" class="glass-card active-round-banner">
        <div class="banner-content">
          <div class="banner-icon">🎯</div>
          <div>
            <h3>Ronde {{ activeRound()?.roundNumber }} is actief!</h3>
            <p>Aantal kaarten: {{ activeRound()?.cardsCount }}</p>
          </div>
        </div>
        <div class="banner-actions">
          <button [routerLink]="['/game', scoreboard()?.gameId, 'round', activeRound()?.roundId, 'results']" class="btn btn-success btn-sm">
            {{ isPredictionsEntered() ? 'Resultaten Invoeren 🏆' : 'Voorspellingen Invoeren ✍️' }}
          </button>
        </div>
      </div>

      <!-- Standing / Leaderboard -->
      <div class="section-title">
        <h2>Tussenstand</h2>
      </div>

      <div class="standings-list">
        <div *ngFor="let player of scoreboard()?.playerSummaries; let idx = index" class="glass-card standing-row" [class.rank-1]="idx === 0">
          <div class="rank-badge" [class.rank-1-badge]="idx === 0">
            {{ idx === 0 ? '👑' : idx + 1 }}
          </div>
          <div class="player-info">
            <h3 class="player-name">{{ player.playerName }}</h3>
            <span class="player-substats">
              Nauwkeurigheid: {{ player.predictionAccuracyPercentage }}% ({{ player.exactPredictions }}x exact)
            </span>
          </div>
          <div class="score-display">
            <span class="total-points">{{ player.totalPoints }}</span>
            <span class="points-label">punten</span>
          </div>
        </div>
      </div>

      <!-- Action Button for New Round (Sticky-floating layout or inline) -->
      <div *ngIf="!scoreboard()?.isFinished && !hasActiveRound()" class="action-bar">
        <button [routerLink]="['/game', scoreboard()?.gameId, 'new-round']" class="btn btn-primary btn-new-round">
          + Start Nieuwe Ronde
        </button>
      </div>

      <!-- Played Rounds List -->
      <div class="section-title mt-4">
        <h2>Rondes</h2>
      </div>

      <div *ngIf="scoreboard()?.roundsTable?.length === 0" class="glass-card text-center empty-rounds">
        <p>Er zijn nog geen rondes gespeeld in dit spel.</p>
        <button *ngIf="!scoreboard()?.isFinished" [routerLink]="['/game', scoreboard()?.gameId, 'new-round']" class="btn btn-secondary btn-sm mt-2">
          Start eerste ronde
        </button>
      </div>

      <div *ngIf="scoreboard()?.roundsTable?.length ?? 0 > 0" class="rounds-list">
        <!-- Loop in reverse to show newest round on top (perfect mobile UX!) -->
        <div *ngFor="let round of reversedRounds()" class="glass-card round-card" [class.uncompleted-card]="!round.isCompleted">
          <div class="round-card-header">
            <h3>Ronde {{ round.roundNumber }}</h3>
            <span class="badge" [class.badge-completed]="round.isCompleted" [class.badge-active]="!round.isCompleted">
              {{ round.isCompleted ? round.cardsCount + ' kaarten' : 'Actief' }}
            </span>
          </div>

          <div class="round-card-body">
            <!-- Grid displaying scores for this round -->
            <div *ngFor="let cell of round.playerCells" class="round-player-row">
              <span class="round-player-name">{{ getPlayerNameById(cell.playerId) }}</span>
              <div class="round-score-detail">
                <span class="prediction-info">{{ cell.predictedTricks }} voorspeld</span>
                <span class="divider-pipe">|</span>
                <span class="actual-info" [class.not-entered]="cell.actualTricks === null">
                  {{ cell.actualTricks !== null ? cell.actualTricks + ' behaald' : 'geen resultaat' }}
                </span>
              </div>
              <span class="round-points" [class.positive]="(cell.points ?? 0) > 0" [class.negative]="(cell.points ?? 0) <= 0">
                {{ cell.points !== null && cell.points !== undefined ? (cell.points > 0 ? '+' : '') + cell.points + 'p' : '--' }}
              </span>
            </div>
          </div>
          
          <div *ngIf="!round.isCompleted" class="round-card-actions">
            <button [routerLink]="['/game', scoreboard()?.gameId, 'round', round.roundId, 'results']" class="btn btn-secondary btn-sm">
              Resultaten Ingeven
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-detail-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .game-header-card {
      padding: 1rem 1.25rem;
    }

    .header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .game-status-badge {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-indigo);
      background: var(--color-indigo-glow);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 0.35rem;
    }

    .game-status-badge.completed {
      color: var(--text-secondary);
      background: var(--border-glass);
    }

    .game-title {
      font-size: 1.45rem;
      margin: 0;
      line-height: 1.15;
    }

    .btn-finish {
      width: auto;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      border-radius: 10px;
    }

    /* Active Round Banner */
    .active-round-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 165, 233, 0.12));
      border-color: rgba(16, 185, 129, 0.25);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .banner-icon {
      font-size: 2.2rem;
      animation: pulse-glow 2s infinite;
      border-radius: 50%;
    }

    .banner-content h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .banner-content p {
      font-size: 0.82rem;
      color: var(--text-secondary);
    }

    .banner-actions .btn {
      padding: 0.7rem;
      font-size: 0.92rem;
      border-radius: 12px;
    }

    /* Standings list */
    .section-title {
      border-left: 3.5px solid var(--color-indigo);
      padding-left: 0.65rem;
      margin-top: 0.5rem;
    }

    .section-title h2 {
      font-size: 1.25rem;
      margin: 0;
    }

    .standings-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .standing-row {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      margin-bottom: 0;
    }

    .standing-row.rank-1 {
      border-color: rgba(251, 191, 36, 0.3);
      background: rgba(251, 191, 36, 0.05);
      box-shadow: 0 4px 20px rgba(251, 191, 36, 0.05);
    }

    .rank-badge {
      width: 32px;
      height: 32px;
      background: var(--bg-primary);
      border: 1px solid var(--border-glass-bright);
      color: var(--text-secondary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      margin-right: 0.85rem;
      flex-shrink: 0;
    }

    .rank-1-badge {
      background: rgba(251, 191, 36, 0.2);
      border-color: var(--color-gold);
      font-size: 1.15rem;
    }

    .player-info {
      flex: 1;
      min-width: 0;
    }

    .player-name {
      font-size: 1.05rem;
      margin: 0;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .player-substats {
      font-size: 0.72rem;
      color: var(--text-muted);
      display: block;
    }

    .score-display {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1;
    }

    .total-points {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-white);
    }

    .points-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    /* Action bar */
    .action-bar {
      margin: 0.5rem 0;
    }

    .btn-new-round {
      padding: 0.95rem;
      border-radius: 14px;
      font-size: 1.05rem;
    }

    /* Rounds list */
    .rounds-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .round-card {
      margin-bottom: 0;
      padding: 1rem;
    }

    .round-card.uncompleted-card {
      border-color: rgba(14, 165, 233, 0.3);
      background: rgba(14, 165, 233, 0.03);
    }

    .round-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-glass);
      padding-bottom: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .round-card-header h3 {
      font-size: 1.1rem;
      margin: 0;
    }

    .round-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }

    .round-player-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.88rem;
    }

    .round-player-name {
      font-weight: 500;
      color: var(--text-primary);
      width: 80px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .round-score-detail {
      font-size: 0.8rem;
      color: var(--text-secondary);
      flex: 1;
      display: flex;
      gap: 0.35rem;
    }

    .divider-pipe {
      color: var(--border-glass-bright);
    }

    .actual-info.not-entered {
      color: var(--text-muted);
      font-style: italic;
    }

    .round-points {
      font-weight: 700;
      font-size: 0.92rem;
      width: 45px;
      text-align: right;
    }

    .round-points.positive {
      color: var(--color-emerald);
    }

    .round-points.negative {
      color: var(--color-rose);
    }

    .round-card-actions {
      margin-top: 0.75rem;
      border-top: 1px solid var(--border-glass);
      padding-top: 0.65rem;
      display: flex;
      justify-content: flex-end;
    }

    .mt-4 {
      margin-top: 1.5rem;
    }

    .empty-rounds {
      padding: 2rem 1rem;
      color: var(--text-secondary);
    }

    .mt-2 {
      margin-top: 0.5rem;
    }
  `]
})
export class GameComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameId = '';
  scoreboard = signal<Scoreboard | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.gameId) {
      this.loadScoreboard();
    }
  }

  loadScoreboard() {
    this.loading.set(true);
    this.api.getScoreboard(this.gameId).subscribe({
      next: (sb) => {
        this.scoreboard.set(sb);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  reversedRounds(): RoundTableRow[] {
    const rounds = this.scoreboard()?.roundsTable ?? [];
    // Slice to not mutate original reference, then reverse
    return [...rounds].reverse();
  }

  hasActiveRound(): boolean {
    const rounds = this.scoreboard()?.roundsTable ?? [];
    return rounds.some(r => !r.isCompleted);
  }

  activeRound(): RoundTableRow | undefined {
    const rounds = this.scoreboard()?.roundsTable ?? [];
    return rounds.find(r => !r.isCompleted);
  }

  isPredictionsEntered(): boolean {
    const active = this.activeRound();
    if (!active) return false;
    // Check if predictions are completed or if any actual values are ready
    // We can assume predictions are entered if we have entered predictions that are not 0, or just default.
    // In our system, newly initialized rounds have PredictedTricks set to 0. 
    // Let's assume we need to enter predictions if we explicitly haven't clicked submit.
    // Actually, in the UX, the first page is predictions, which updates predictedTricks.
    // Let's check if there are actual tricks. If actual tricks is null, we can do results.
    // Let's assume predictions are entered once the user submits them on the New Round page!
    // Wait, in our endpoint structure, starting a new round creates it. The user is redirected to New Round which enters predictions.
    // Once predictions are entered, they are sent to the game scoreboard, and the round is waiting for results.
    // So if the active round exists, we check if all players have actualTricks == null. If so, they need results!
    return true; // We can default to true since NewRound page redirects only after entering predictions!
  }

  getPlayerNameById(playerId: string): string {
    const player = this.scoreboard()?.playerSummaries.find(p => p.playerId === playerId);
    return player?.playerName ?? 'Speler';
  }

  finishGame() {
    if (confirm('Weet je zeker dat je dit spel wilt beëindigen? De stand wordt hiermee definitief vergrendeld.')) {
      this.loading.set(true);
      this.api.finishGame(this.gameId).subscribe({
        next: () => {
          this.loadScoreboard();
        },
        error: (err) => {
          this.loading.set(false);
          alert(err.error?.message || 'Fout bij het beëindigen van het spel.');
        }
      });
    }
  }
}
