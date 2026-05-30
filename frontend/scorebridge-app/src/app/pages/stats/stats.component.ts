import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, AllTimeStats } from '../../services/api.service';
import { NgIf, NgFor, PercentPipe } from '@angular/common';

@Component({
  selector: 'app-stats',
  imports: [NgIf, NgFor],
  template: `
    <div class="stats-container">
      <div class="header">
        <h1>All-Time Statistieken</h1>
        <p class="description">Historische ranglijsten en records over alle beëindigde spellen.</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-container">
        <div class="spinner"></div>
        <p>Statistieken compileren...</p>
      </div>

      <div *ngIf="!loading() && !stats()" class="glass-card text-center empty-state">
        <h3>Nog geen statistieken</h3>
        <p>Er moeten spellen voltooid zijn om statistieken te kunnen bekijken.</p>
      </div>

      <div *ngIf="!loading() && stats()" class="stats-content">
        
        <!-- Global Metrics -->
        <div class="metrics-grid">
          <div class="glass-card metric-box">
            <span class="metric-value">{{ stats()?.totalGames }}</span>
            <span class="metric-label">Spellen</span>
          </div>
          <div class="glass-card metric-box">
            <span class="metric-value">{{ stats()?.totalRounds }}</span>
            <span class="metric-label">Rondes</span>
          </div>
          <div class="glass-card metric-box">
            <span class="metric-value">{{ stats()?.totalPlayers }}</span>
            <span class="metric-label">Spelers</span>
          </div>
        </div>

        <!-- Tab Switching for Rankings -->
        <div class="glass-card tabs-card">
          <div class="tabs-header">
            <button (click)="activeTab = 'total'" [class.active]="activeTab === 'total'" class="tab-btn">
              Totaal Punten
            </button>
            <button (click)="activeTab = 'average'" [class.active]="activeTab === 'average'" class="tab-btn">
              Gemiddelde
            </button>
          </div>

          <div class="tab-content mt-3">
            <!-- Ranking by Total Points -->
            <div *ngIf="activeTab === 'total'" class="ranking-list">
              <div *ngFor="let row of stats()?.rankingByTotalPoints; let idx = index" class="ranking-row">
                <span class="rank-num" [class.gold]="idx === 0" [class.silver]="idx === 1" [class.bronze]="idx === 2">
                  {{ idx + 1 }}
                </span>
                <span class="rank-name">{{ row.playerName }}</span>
                <span class="rank-detail">{{ row.gamesPlayed }} spellen</span>
                <span class="rank-value">{{ row.totalPoints }} pts</span>
              </div>
            </div>

            <!-- Ranking by Average Points per Round -->
            <div *ngIf="activeTab === 'average'" class="ranking-list">
              <div *ngFor="let row of stats()?.rankingByAveragePoints; let idx = index" class="ranking-row">
                <span class="rank-num" [class.gold]="idx === 0">
                  {{ idx + 1 }}
                </span>
                <span class="rank-name">{{ row.playerName }}</span>
                <span class="rank-detail">{{ row.roundsPlayed }} rondes</span>
                <span class="rank-value">{{ row.averagePoints }} / rd</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Badges & Hall of Fame -->
        <div class="section-title mt-4">
          <h2>Eregalerij (Badges)</h2>
        </div>

        <div class="badges-grid">
          <!-- Puntenkoning -->
          <div *ngIf="stats()?.rankingByTotalPoints?.length ?? 0 > 0" class="glass-card badge-award-card">
            <div class="badge-award award-king">
              <span>👑</span>
              <span>Puntenkoning</span>
            </div>
            <div class="award-winner">
              <h3>{{ stats()?.rankingByTotalPoints?.[0]?.playerName }}</h3>
              <p>Met een all-time record van {{ stats()?.rankingByTotalPoints?.[0]?.totalPoints }} punten!</p>
            </div>
          </div>

          <!-- Beste Voorspeller -->
          <div *ngIf="stats()?.playerWithBestPredictionAccuracy" class="glass-card badge-award-card">
            <div class="badge-award award-target">
              <span>🎯</span>
              <span>Beste Voorspeller</span>
            </div>
            <div class="award-winner">
              <h3>{{ stats()?.playerWithBestPredictionAccuracy?.playerName }}</h3>
              <p>
                Voorspelt <strong>{{ stats()?.playerWithBestPredictionAccuracy?.accuracyPercentage }}%</strong> van de rondes exact goed! ({{ stats()?.playerWithBestPredictionAccuracy?.roundsPlayed }} rondes)
              </p>
            </div>
          </div>

          <!-- Grootste Optimist -->
          <div *ngIf="stats()?.playerWithMostOverpredictions" class="glass-card badge-award-card">
            <div class="badge-award award-optimist">
              <span>☀️</span>
              <span>Grootste Optimist</span>
            </div>
            <div class="award-winner">
              <h3>{{ stats()?.playerWithMostOverpredictions?.playerName }}</h3>
              <p>Dacht {{ stats()?.playerWithMostOverpredictions?.count }} keer meer slagen te halen dan in werkelijkheid!</p>
            </div>
          </div>

          <!-- Grootste Pessimist -->
          <div *ngIf="stats()?.playerWithMostUnderpredictions" class="glass-card badge-award-card">
            <div class="badge-award award-pessimist">
              <span>🌧️</span>
              <span>Grootste Pessimist</span>
            </div>
            <div class="award-winner">
              <h3>{{ stats()?.playerWithMostUnderpredictions?.playerName }}</h3>
              <p>Dacht {{ stats()?.playerWithMostUnderpredictions?.count }} keer minder slagen te halen dan behaald!</p>
            </div>
          </div>

          <!-- Pechvogel (Worst round) -->
          <div *ngIf="stats()?.worstSingleRoundScore" class="glass-card badge-award-card">
            <div class="badge-award award-unlucky">
              <span>🦚</span>
              <span>Pechvogel</span>
            </div>
            <div class="award-winner">
              <h3>{{ stats()?.worstSingleRoundScore?.playerName }}</h3>
              <p>
                Haalde <strong>{{ stats()?.worstSingleRoundScore?.points }}</strong> punten in ronde {{ stats()?.worstSingleRoundScore?.roundNumber }} van "{{ stats()?.worstSingleRoundScore?.gameName }}".
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .description {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .metric-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem 0.5rem;
      text-align: center;
      margin-bottom: 0;
    }

    .metric-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-white);
      line-height: 1.1;
    }

    .metric-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-top: 0.2rem;
    }

    /* Tabs */
    .tabs-card {
      padding: 0.75rem;
      margin-bottom: 0;
    }

    .tabs-header {
      display: flex;
      background: var(--bg-primary);
      padding: 0.25rem;
      border-radius: 12px;
      border: 1px solid var(--border-glass);
    }

    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-family: var(--font-family);
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.65rem;
      border-radius: 10px;
      cursor: pointer;
      transition: var(--transition-fast);
    }

    .tab-btn.active {
      background: var(--bg-glass-card);
      color: var(--color-indigo);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    .mt-3 {
      margin-top: 0.75rem;
    }

    /* Rankings List */
    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .ranking-row {
      display: flex;
      align-items: center;
      padding: 0.65rem 0.5rem;
      border-bottom: 1px solid var(--border-glass);
      font-size: 0.92rem;
    }

    .ranking-row:last-child {
      border-bottom: none;
    }

    .rank-num {
      width: 24px;
      font-weight: 800;
      color: var(--text-muted);
    }

    .rank-num.gold { color: var(--color-gold); }
    .rank-num.silver { color: #cbd5e1; }
    .rank-num.bronze { color: #b45309; }

    .rank-name {
      flex: 1;
      font-weight: 600;
      color: var(--text-primary);
    }

    .rank-detail {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-right: 1rem;
    }

    .rank-value {
      font-weight: 800;
      color: var(--text-white);
    }

    /* Badges list */
    .section-title {
      border-left: 3.5px solid var(--color-indigo);
      padding-left: 0.65rem;
      margin-top: 0.5rem;
    }

    .section-title h2 {
      font-size: 1.25rem;
      margin: 0;
    }

    .mt-4 {
      margin-top: 1.5rem;
    }

    .badges-grid {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .badge-award-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.1rem;
      margin-bottom: 0;
    }

    .badge-award-card .badge-award {
      flex-shrink: 0;
      width: 140px;
      justify-content: center;
    }

    .award-winner {
      min-width: 0;
    }

    .award-winner h3 {
      font-size: 1.1rem;
      margin-bottom: 0.15rem;
      color: var(--text-white);
    }

    .award-winner p {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.35;
    }
  `]
})
export class StatsComponent implements OnInit {
  private api = inject(ApiService);

  stats = signal<AllTimeStats | null>(null);
  loading = signal(true);
  activeTab = 'total'; // 'total' or 'average'

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.api.getAllTimeStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
