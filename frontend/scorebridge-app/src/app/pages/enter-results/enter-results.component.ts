import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, Round, Scoreboard, ResultEntry } from '../../services/api.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [NgIf, NgFor, RouterLink, FormsModule],
  selector: 'app-enter-results',
  template: `
    <div *ngIf="loading()" class="loading-container">
      <div class="spinner"></div>
      <p>Rondegegevens laden...</p>
    </div>

    <div *ngIf="!loading() && round()" class="enter-results-container">
      <div class="header">
        <h1>Resultaten Ingeven</h1>
        <p class="description">Ronde {{ round()?.roundNumber }} • {{ round()?.cardsCount }} kaarten</p>
      </div>

      <div *ngIf="errorMessage()" class="alert alert-danger">
        <span>{{ errorMessage() }}</span>
        <button (click)="clearError()" class="alert-close">×</button>
      </div>

      <div class="glass-card">
        <h2>Slagen & Punten Preview</h2>
        <p class="description mb-3">Geef per speler de behaalde slagen in. Zie direct de scorepreview!</p>

        <div class="players-results-list">
          <div *ngFor="let score of round()?.scores" class="result-input-row">
            <div class="player-meta">
              <span class="player-name">{{ score.playerName }}</span>
              <span class="prediction-pill">Voorspeld: {{ score.predictedTricks }}</span>
            </div>

            <!-- Tricks adjust buttons -->
            <div class="tricks-picker-container">
              <div class="tricks-picker">
                <button type="button" (click)="adjustActual(score.gamePlayerId, -1)" class="btn btn-secondary btn-picker-adjust">-</button>
                <span class="tricks-value">{{ getActualValue(score.gamePlayerId) }}</span>
                <button type="button" (click)="adjustActual(score.gamePlayerId, 1)" class="btn btn-secondary btn-picker-adjust">+</button>
              </div>
            </div>

            <!-- Live point preview chip -->
            <div class="points-preview">
              <span class="preview-badge" [class.positive]="getPreviewPoints(score.gamePlayerId, score.predictedTricks) > 0" [class.negative]="getPreviewPoints(score.gamePlayerId, score.predictedTricks) <= 0">
                {{ getPreviewPoints(score.gamePlayerId, score.predictedTricks) > 0 ? '+' : '' }}{{ getPreviewPoints(score.gamePlayerId, score.predictedTricks) }}p
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sum Check Box -->
      <div class="glass-card sum-check-card" [class.correct]="totalActual() === round()?.cardsCount">
        <div class="sum-flex">
          <div>
            <h3>Totaal behaalde slagen: <strong>{{ totalActual() }}</strong></h3>
            <p>Moet gelijk zijn aan aantal kaarten: <strong>{{ round()?.cardsCount }}</strong></p>
          </div>
          <div class="sum-status-icon">
            {{ totalActual() === round()?.cardsCount ? '✅' : '❌' }}
          </div>
        </div>
      </div>

      <!-- Complete Round Button -->
      <button
        (click)="completeRound()"
        [disabled]="submitting() || totalActual() !== round()?.cardsCount"
        class="btn btn-success btn-complete-round"
      >
        {{ submitting() ? 'Resultaten opslaan...' : 'Ronde Voltooien 🏆' }}
      </button>
    </div>
  `,
  styles: [`
    .enter-results-container {
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

    /* Players list */
    .players-results-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .result-input-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-glass);
      gap: 0.5rem;
    }

    .result-input-row:last-child {
      border-bottom: none;
    }

    .player-meta {
      flex: 1.2;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .player-name {
      font-size: 1rem;
      font-weight: 600;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .prediction-pill {
      font-size: 0.72rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-glass-bright);
      color: var(--text-secondary);
      padding: 0.1rem 0.45rem;
      border-radius: 6px;
      width: fit-content;
    }

    /* Tricks picker */
    .tricks-picker-container {
      flex: 1.1;
      display: flex;
      justify-content: center;
    }

    .tricks-picker {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      background: rgba(9, 13, 22, 0.4);
      padding: 0.2rem;
      border-radius: 8px;
      border: 1px solid var(--border-glass);
    }

    .btn-picker-adjust {
      width: 32px;
      height: 32px;
      font-size: 1.1rem;
      padding: 0;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .tricks-value {
      width: 26px;
      text-align: center;
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--text-white);
    }

    /* Points Preview Chip */
    .points-preview {
      flex: 0.6;
      display: flex;
      justify-content: flex-end;
    }

    .preview-badge {
      display: inline-block;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.35rem 0.6rem;
      border-radius: 8px;
      text-align: center;
      width: 50px;
    }

    .preview-badge.positive {
      background: rgba(16, 185, 129, 0.12);
      color: var(--color-emerald);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .preview-badge.negative {
      background: rgba(244, 63, 94, 0.12);
      color: var(--color-rose);
      border: 1px solid rgba(244, 63, 94, 0.2);
    }

    /* Sum check card */
    .sum-check-card {
      border-color: rgba(244, 63, 94, 0.2);
      background: rgba(244, 63, 94, 0.03);
      transition: var(--transition-normal);
    }

    .sum-check-card.correct {
      border-color: rgba(16, 185, 129, 0.25);
      background: rgba(16, 185, 129, 0.05);
    }

    .sum-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sum-check-card h3 {
      font-size: 1.05rem;
      margin: 0;
    }

    .sum-check-card p {
      font-size: 0.8rem;
    }

    .sum-status-icon {
      font-size: 1.75rem;
    }

    .btn-complete-round {
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
export class EnterResultsComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameId = '';
  roundId = '';
  round = signal<Round | null>(null);
  
  loading = signal(true);
  submitting = signal(false);
  errorMessage = signal('');

  actualsMap = new Map<string, number>();

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    this.roundId = this.route.snapshot.paramMap.get('roundId') ?? '';
    if (this.roundId) {
      this.loadRoundData();
    }
  }

  loadRoundData() {
    this.loading.set(true);
    this.api.getRound(this.roundId).subscribe({
      next: (r) => {
        this.round.set(r);
        
        // Initialize actuals map
        r.scores.forEach(s => {
          // prefill with previous actual if exist, else default to predicted
          this.actualsMap.set(s.gamePlayerId, s.actualTricks ?? s.predictedTricks);
        });

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getActualValue(gamePlayerId: string): number {
    return this.actualsMap.get(gamePlayerId) ?? 0;
  }

  adjustActual(gamePlayerId: string, amount: number) {
    const current = this.actualsMap.get(gamePlayerId) ?? 0;
    const nextVal = current + amount;
    const cards = this.round()?.cardsCount ?? 0;

    if (nextVal >= 0 && nextVal <= cards) {
      this.actualsMap.set(gamePlayerId, nextVal);
    }
  }

  getPreviewPoints(gamePlayerId: string, predicted: number): number {
    const actual = this.getActualValue(gamePlayerId);
    if (predicted === actual) {
      return 10 + actual;
    } else {
      return -Math.abs(predicted - actual);
    }
  }

  totalActual(): number {
    let total = 0;
    this.actualsMap.forEach((val) => {
      total += val;
    });
    return total;
  }

  clearError() {
    this.errorMessage.set('');
  }

  completeRound() {
    const cards = this.round()?.cardsCount ?? 0;
    const total = this.totalActual();

    if (total !== cards) {
      this.errorMessage.set(`Totaal behaalde slagen (${total}) moet exact gelijk zijn aan het aantal kaarten in de ronde (${cards}).`);
      return;
    }

    this.clearError();
    this.submitting.set(true);

    // 1. Submit results to calculate points
    const resultsList: ResultEntry[] = [];
    this.actualsMap.forEach((val, key) => {
      resultsList.push({
        gamePlayerId: key,
        actualTricks: val
      });
    });

    this.api.submitResults(this.roundId, resultsList).subscribe({
      next: () => {
        // 2. Lock and complete round
        this.api.completeRound(this.roundId).subscribe({
          next: () => {
            this.submitting.set(false);
            // Redirect back to scoreboard, standings will refresh!
            this.router.navigate(['/game', this.gameId]);
          },
          error: (err) => {
            this.submitting.set(false);
            this.errorMessage.set(err.error?.message || 'Fout bij het afronden van de ronde.');
          }
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Fout bij het opslaan van resultaten.');
      }
    });
  }
}
