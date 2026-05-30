import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, Scoreboard, PredictionEntry } from '../../services/api.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-round',
  imports: [NgIf, NgFor, RouterLink, FormsModule],
  template: `
    <div *ngIf="loading()" class="loading-container">
      <div class="spinner"></div>
      <p>Spelgegevens laden...</p>
    </div>

    <div *ngIf="!loading() && scoreboard()" class="new-round-container">
      <div class="header">
        <h1>Nieuwe Ronde</h1>
        <p class="description">Spel: {{ scoreboard()?.gameName }}</p>
      </div>

      <div *ngIf="errorMessage()" class="alert alert-danger">
        <span>{{ errorMessage() }}</span>
        <button (click)="clearError()" class="alert-close">×</button>
      </div>

      <!-- Step 1: Cards count input -->
      <div class="glass-card">
        <div class="form-group cards-input-group">
          <label class="form-label" for="cardsCountInput">Aantal kaarten in deze ronde</label>
          <div class="cards-count-picker">
            <button type="button" (click)="adjustCards(-1)" class="btn btn-secondary btn-adjust">-</button>
            <input
              id="cardsCountInput"
              type="number"
              class="form-control text-center text-bold"
              [(ngModel)]="cardsCount"
              name="cardsCount"
              required
              min="1"
              max="100"
              (ngModelChange)="checkTotalTricksGlow()"
            />
            <button type="button" (click)="adjustCards(1)" class="btn btn-secondary btn-adjust">+</button>
          </div>
        </div>
      </div>

      <!-- Step 2: Input predictions per player -->
      <div class="glass-card">
        <h2>Voorspellingen Ingeven</h2>
        <p class="description mb-3">Hoeveel slagen denkt elke speler te halen?</p>

        <div class="players-predictions-list">
          <div *ngFor="let player of playersList(); let idx = index" class="prediction-input-row">
            <span class="player-name">{{ player.playerName }}</span>
            
            <div class="tricks-picker">
              <button type="button" (click)="adjustPrediction(player.gamePlayerId, -1)" class="btn btn-secondary btn-picker-adjust">-</button>
              <span class="tricks-value">{{ getPredictionValue(player.gamePlayerId) }}</span>
              <button type="button" (click)="adjustPrediction(player.gamePlayerId, 1)" class="btn btn-secondary btn-picker-adjust">+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Warning Indicator (Glow alert) -->
      <div *ngIf="showWarning()" class="alert alert-warning-glow">
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">
          Opgelet: Het totaal aantal voorspelde slagen (<strong>{{ totalPredicted() }}</strong>) is gelijk aan het aantal kaarten (<strong>{{ cardsCount }}</strong>). Iedereen kan dus correct spelen en er kan niemand nat gaan.
        </span>
      </div>

      <!-- Submit Action Button -->
      <button (click)="submitRound()" [disabled]="submitting() || cardsCount < 1" class="btn btn-primary btn-save-round">
        {{ submitting() ? 'Ronde opslaan...' : 'Ronde Starten 🚀' }}
      </button>
    </div>
  `,
  styles: [`
    .new-round-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .description {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .mb-3 {
      margin-bottom: 1rem;
    }

    .cards-input-group {
      margin-bottom: 0;
    }

    /* Cards Count Picker */
    .cards-count-picker {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .btn-adjust {
      width: 48px;
      height: 48px;
      font-size: 1.5rem;
      padding: 0;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .text-center {
      text-align: center;
    }

    .text-bold {
      font-weight: 800;
      font-size: 1.35rem;
    }

    /* Player Predictions Input List */
    .players-predictions-list {
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
    }

    .prediction-input-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.35rem 0;
      border-bottom: 1px solid var(--border-glass);
    }

    .prediction-input-row:last-child {
      border-bottom: none;
    }

    .player-name {
      font-size: 1.05rem;
      font-weight: 500;
    }

    /* Tricks Picker UI */
    .tricks-picker {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: rgba(9, 13, 22, 0.4);
      padding: 0.25rem;
      border-radius: 10px;
      border: 1px solid var(--border-glass);
    }

    .btn-picker-adjust {
      width: 34px;
      height: 34px;
      font-size: 1.2rem;
      padding: 0;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .tricks-value {
      width: 32px;
      text-align: center;
      font-weight: 700;
      font-size: 1.15rem;
      color: var(--text-white);
    }

    /* Warning alert glow */
    .alert-warning-glow {
      background-color: rgba(245, 158, 11, 0.08);
      color: var(--color-amber);
      border-color: rgba(245, 158, 11, 0.2);
      font-size: 0.85rem;
      line-height: 1.4;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.95rem;
      border-radius: 14px;
    }

    .warning-icon {
      font-size: 1.3rem;
      line-height: 1;
      margin-top: 2px;
    }

    .btn-save-round {
      padding: 1rem;
      font-size: 1.1rem;
      margin-top: 0.5rem;
    }

    /* Alert */
    .alert {
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid transparent;
    }

    .alert-danger {
      background-color: rgba(244, 63, 94, 0.1);
      color: var(--color-rose);
      border-color: rgba(244, 63, 94, 0.2);
    }

    .alert-close {
      background: none;
      border: none;
      color: currentColor;
      font-size: 1.35rem;
      cursor: pointer;
      line-height: 1;
    }
  `]
})
export class NewRoundComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameId = '';
  scoreboard = signal<Scoreboard | null>(null);
  
  loading = signal(true);
  submitting = signal(false);
  errorMessage = signal('');

  cardsCount = 5; // Default cards
  predictionsMap = new Map<string, number>();

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.gameId) {
      this.loadGameData();
    }
  }

  loadGameData() {
    this.loading.set(true);
    this.api.getScoreboard(this.gameId).subscribe({
      next: (sb) => {
        this.scoreboard.set(sb);
        
        // Auto-determine next cards count. 
        // A common sequence is starting high (e.g. 8 cards) down to 1, or starting at 1 card and going up.
        // Let's analyze previous rounds to increment or decrement:
        const rounds = sb.roundsTable;
        if (rounds.length > 0) {
          const lastRound = rounds[rounds.length - 1];
          const lastCards = lastRound.cardsCount;
          // If we had a round with e.g. 5, usually next might be 6 (going up) or 4 (going down). 
          // Let's default to lastCards - 1 if lastCards > 1, else 2.
          this.cardsCount = lastCards > 1 ? lastCards - 1 : 2;
        } else {
          // If first round, default to 8 kaarten
          this.cardsCount = 8;
        }

        // Initialize predictions map to 0 for all game players
        sb.playerSummaries.forEach(p => {
          this.predictionsMap.set(p.gamePlayerId, 0);
        });

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  playersList() {
    return this.scoreboard()?.playerSummaries ?? [];
  }

  adjustCards(amount: number) {
    const nextVal = this.cardsCount + amount;
    if (nextVal >= 1) {
      this.cardsCount = nextVal;
    }
  }

  getPredictionValue(gamePlayerId: string): number {
    return this.predictionsMap.get(gamePlayerId) ?? 0;
  }

  adjustPrediction(gamePlayerId: string, amount: number) {
    const current = this.predictionsMap.get(gamePlayerId) ?? 0;
    const nextVal = current + amount;
    if (nextVal >= 0 && nextVal <= this.cardsCount) {
      this.predictionsMap.set(gamePlayerId, nextVal);
    }
  }

  totalPredicted(): number {
    let total = 0;
    this.predictionsMap.forEach((val) => {
      total += val;
    });
    return total;
  }

  showWarning(): boolean {
    return this.totalPredicted() === this.cardsCount;
  }

  checkTotalTricksGlow() {
    // Just a placeholder to trigger change detection UI updates
  }

  clearError() {
    this.errorMessage.set('');
  }

  submitRound() {
    if (this.cardsCount < 1) {
      this.errorMessage.set('Aantal kaarten moet minimaal 1 zijn.');
      return;
    }

    this.clearError();
    this.submitting.set(true);

    // 1. Create the round
    this.api.createRound(this.gameId, this.cardsCount).subscribe({
      next: (round) => {
        // 2. Submit the predictions
        const predictionsList: PredictionEntry[] = [];
        this.predictionsMap.forEach((val, key) => {
          predictionsList.push({
            gamePlayerId: key,
            predictedTricks: val
          });
        });

        this.api.submitPredictions(round.id, predictionsList).subscribe({
          next: () => {
            this.submitting.set(false);
            // Redirect back to scoreboard, the active round banner will display!
            this.router.navigate(['/game', this.gameId]);
          },
          error: (err) => {
            this.submitting.set(false);
            this.errorMessage.set(err.error?.message || 'Fout bij het opslaan van voorspellingen.');
          }
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Fout bij het aanmaken van de ronde.');
      }
    });
  }
}
