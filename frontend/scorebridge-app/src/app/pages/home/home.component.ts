import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Game } from '../../services/api.service';
import { DatePipe, NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgIf, NgFor, DatePipe],
  template: `
    <div class="home-container">
      <div class="hero-section text-center">
        <div class="logo-badge">🃏🌉</div>
        <h1 class="brand-title">ScoreBridge</h1>
        <p class="brand-subtitle">Chinees Poepen</p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="quick-actions">
        <a routerLink="/new-game" class="btn btn-primary btn-lg">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nieuw Spel
        </a>
      </div>

      <!-- Active Games Section (Resume Game) -->
      <div class="section-title-container">
        <h2>Verder Spelen</h2>
      </div>

      <div *ngIf="loading()" class="loading-container">
        <div class="spinner"></div>
        <p>Spellen laden...</p>
      </div>

      <div *ngIf="!loading() && activeGames().length === 0" class="glass-card text-center empty-card">
        <p class="mb-3">Geen actieve spellen gevonden.</p>
        <a routerLink="/new-game" class="btn btn-secondary btn-sm">Start een spel</a>
      </div>

      <div *ngIf="!loading() && activeGames().length > 0" class="active-games-list">
        <div *ngFor="let game of activeGames()" [routerLink]="['/game', game.id]" class="glass-card interactive game-card">
          <div class="game-info">
            <h3 class="game-name">{{ game.name }}</h3>
            <span class="game-date">Gestart op {{ game.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
            <div class="players-inline">
              <span class="players-label">Spelers: </span>
              <span *ngFor="let gp of game.players; let last = last" class="player-name-chip">
                {{ gp.playerName }}{{ !last ? ', ' : '' }}
              </span>
            </div>
          </div>
          <div class="chevron">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>


    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .hero-section {
      padding: 1.5rem 0 0.5rem 0;
      text-align: center;
    }

    .logo-badge {
      font-size: 3.5rem;
      margin-bottom: 0.5rem;
      filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3));
      animation: float 4s ease-in-out infinite;
    }

    .brand-title {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.25rem;
    }

    .brand-subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .quick-actions {
      margin-top: 0.5rem;
    }

    .btn-lg {
      padding: 1.1rem;
      font-size: 1.15rem;
      border-radius: 16px;
    }

    .section-title-container {
      border-left: 3.5px solid var(--color-indigo);
      padding-left: 0.65rem;
    }

    .section-title-container h2 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--text-primary);
    }

    .empty-card {
      padding: 2.5rem 1.5rem;
    }

    .mb-3 {
      margin-bottom: 1rem;
    }

    .btn-sm {
      padding: 0.6rem 1.2rem;
      font-size: 0.85rem;
      border-radius: 10px;
      width: auto;
    }

    .game-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }

    .game-name {
      font-size: 1.1rem;
      margin-bottom: 0.15rem;
    }

    .game-date {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.5rem;
    }

    .players-inline {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .players-label {
      font-weight: 500;
      color: var(--text-muted);
    }

    .player-name-chip {
      color: var(--text-primary);
      font-weight: 500;
    }

    .chevron {
      color: var(--text-muted);
      transition: var(--transition-fast);
    }

    .game-card:hover .chevron {
      color: var(--color-indigo);
      transform: translateX(3px);
    }

    .demo-section h3 {
      font-size: 1.05rem;
      margin-bottom: 0.35rem;
    }

    .demo-section p {
      font-size: 0.85rem;
    }

    .seed-feedback {
      font-size: 0.85rem;
      color: var(--color-emerald);
      margin-top: 0.75rem;
      font-weight: 500;
      text-align: center;
    }
  `]
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);

  activeGames = signal<Game[]>([]);
  loading = signal(true);
  seeding = signal(false);
  seedMessage = signal('');

  ngOnInit() {
    this.loadActiveGames();
  }

  loadActiveGames() {
    this.loading.set(true);
    this.api.getGames().subscribe({
      next: (games) => {
        // Filter out completed games
        this.activeGames.set(games.filter(g => !g.isFinished));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  seedData() {
    this.seeding.set(true);
    this.seedMessage.set('');
    this.api.seedDemoData().subscribe({
      next: (res) => {
        this.seeding.set(false);
        this.seedMessage.set(res.message || 'Demo gegevens succesvol geladen!');
        // Reload games list
        this.loadActiveGames();
      },
      error: (err) => {
        this.seeding.set(false);
        this.seedMessage.set(err.error?.message || 'Seeding mislukt. Alleen toegestaan in Development.');
      }
    });
  }
}
