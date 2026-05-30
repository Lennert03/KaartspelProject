import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService, Player } from '../../services/api.service';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-new-game',
  imports: [NgIf, NgFor, RouterLink, FormsModule],
  template: `
    <div class="new-game-container">
      <div class="header">
        <h1>Nieuw Spel Starten</h1>
        <p class="description">Configureer je spel en selecteer de spelers in de juiste volgorde (kloksgewijs).</p>
      </div>

      <div *ngIf="errorMessage()" class="alert alert-danger">
        <span>{{ errorMessage() }}</span>
        <button (click)="clearError()" class="alert-close">×</button>
      </div>

      <!-- Step 1: Game Settings -->
      <div class="glass-card">
        <div class="form-group">
          <label class="form-label" for="gameNameInput">Naam van het spel</label>
          <input
            id="gameNameInput"
            type="text"
            class="form-control"
            placeholder="Bijv. Gezellige Vrijdagavond"
            [(ngModel)]="gameName"
            name="gameName"
            required
            maxlength="100"
          />
        </div>
      </div>

      <!-- Step 2: Select Players -->
      <div class="glass-card">
        <div class="flex-header mb-3">
          <h2>Spelers Selecteren</h2>
          <span class="count-pill">{{ selectedPlayers().length }} geselecteerd</span>
        </div>

        <!-- Inline Quick Add Player -->
        <div class="quick-add-player form-group">
          <label class="form-label" for="quickAddInput">Speler snel toevoegen</label>
          <div class="input-with-button">
            <input
              id="quickAddInput"
              type="text"
              class="form-control"
              placeholder="Spelernaam..."
              [(ngModel)]="quickPlayerName"
              name="quickPlayerName"
              maxlength="50"
              (keyup.enter)="quickAddPlayer()"
            />
            <button type="button" (click)="quickAddPlayer()" [disabled]="!quickPlayerName.trim()" class="btn btn-secondary btn-quick-add">
              Voeg toe
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loadingPlayers()" class="loading-container">
          <div class="spinner"></div>
          <p>Spelers laden...</p>
        </div>

        <!-- Selected Players List (Order visualization) -->
        <div *ngIf="selectedPlayers().length > 0" class="selected-players-tray mb-3">
          <label class="form-label">Speelvolgorde (sleep of klik om te verwijderen)</label>
          <div class="order-list">
            <div *ngFor="let player of selectedPlayers(); let i = index" (click)="togglePlayerSelection(player)" class="order-chip">
              <span class="seat-badge">{{ i + 1 }}</span>
              <span class="order-name">{{ player.name }}</span>
              <span class="remove-cross">×</span>
            </div>
          </div>
        </div>

        <!-- Existing Players Selector Grid -->
        <label class="form-label">Kies uit beschikbare spelers</label>
        <div *ngIf="!loadingPlayers() && availablePlayers().length === 0" class="empty-state text-center">
          <p>Geen spelers beschikbaar. Voeg hierboven een speler toe!</p>
        </div>

        <div *ngIf="!loadingPlayers() && availablePlayers().length > 0" class="players-grid">
          <button
            type="button"
            *ngFor="let player of availablePlayers()"
            (click)="togglePlayerSelection(player)"
            [class.selected]="isPlayerSelected(player)"
            class="player-selector-btn"
          >
            <div class="player-avatar">{{ player.name.substring(0,2).toUpperCase() }}</div>
            <span class="player-label-name">{{ player.name }}</span>
            <div class="check-indicator" *ngIf="isPlayerSelected(player)">
              {{ getPlayerSeatIndex(player) }}
            </div>
          </button>
        </div>
      </div>

      <!-- Action Button -->
      <button
        (click)="startGame()"
        [disabled]="selectedPlayers().length < 2 || starting() || !gameName.trim()"
        class="btn btn-primary btn-start-game"
      >
        {{ starting() ? 'Spel starten...' : 'Spel Starten 🚀' }}
      </button>
    </div>
  `,
  styles: [`
    .new-game-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .description {
      font-size: 0.88rem;
      color: var(--text-secondary);
    }

    .flex-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mb-3 {
      margin-bottom: 1rem;
    }

    .count-pill {
      background: var(--color-indigo-glow);
      color: var(--color-indigo);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    /* Inline Quick Add Player */
    .input-with-button {
      display: flex;
      gap: 0.5rem;
    }

    .btn-quick-add {
      width: auto;
      flex-shrink: 0;
      padding-inline: 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
    }

    /* Selected Players Tray */
    .selected-players-tray {
      background: rgba(9, 13, 22, 0.4);
      padding: 0.75rem;
      border-radius: 12px;
      border: 1px dashed var(--border-glass);
    }

    .order-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }

    .order-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-glass-bright);
      padding: 0.35rem 0.65rem 0.35rem 0.35rem;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 500;
      transition: var(--transition-fast);
    }

    .order-chip:active {
      transform: scale(0.95);
    }

    .seat-badge {
      background: var(--color-indigo);
      color: var(--text-white);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
      border-radius: 6px;
    }

    .remove-cross {
      color: var(--text-muted);
      font-size: 1rem;
      font-weight: bold;
    }

    .order-chip:hover .remove-cross {
      color: var(--color-rose);
    }

    /* Players grid selector */
    .players-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.65rem;
      margin-top: 0.35rem;
    }

    .player-selector-btn {
      background: rgba(9, 13, 22, 0.4);
      border: 1px solid var(--border-glass);
      border-radius: 14px;
      padding: 0.85rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      position: relative;
      transition: var(--transition-fast);
      color: var(--text-secondary);
    }

    .player-selector-btn:active {
      transform: scale(0.96);
    }

    .player-selector-btn.selected {
      border-color: var(--color-indigo);
      background: rgba(99, 102, 241, 0.08);
      color: var(--text-primary);
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.1);
    }

    .player-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-glass-bright);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      transition: var(--transition-fast);
    }

    .player-selector-btn.selected .player-avatar {
      background: var(--color-indigo);
      color: var(--text-white);
      border-color: transparent;
    }

    .player-label-name {
      font-size: 0.82rem;
      font-weight: 500;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      width: 100%;
      text-align: center;
    }

    .check-indicator {
      position: absolute;
      top: 6px;
      right: 6px;
      background: var(--color-indigo);
      color: var(--text-white);
      font-size: 0.7rem;
      font-weight: 800;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-start-game {
      margin-top: 0.5rem;
      padding: 1rem;
      font-size: 1.1rem;
    }

    /* Alerts */
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
export class NewGameComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  availablePlayers = signal<Player[]>([]);
  selectedPlayers = signal<Player[]>([]);
  
  loadingPlayers = signal(true);
  starting = signal(false);
  errorMessage = signal('');

  gameName = '';
  quickPlayerName = '';

  ngOnInit() {
    // Generate standard name based on date
    const date = new Date();
    this.gameName = `Spel op ${date.getDate()}-${date.getMonth() + 1} om ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    this.loadPlayers();
  }

  loadPlayers() {
    this.loadingPlayers.set(true);
    this.api.getPlayers().subscribe({
      next: (players) => {
        this.availablePlayers.set(players);
        this.loadingPlayers.set(false);
      },
      error: () => this.loadingPlayers.set(false)
    });
  }

  isPlayerSelected(player: Player): boolean {
    return this.selectedPlayers().some(p => p.id === player.id);
  }

  getPlayerSeatIndex(player: Player): number {
    return this.selectedPlayers().findIndex(p => p.id === player.id) + 1;
  }

  togglePlayerSelection(player: Player) {
    const current = this.selectedPlayers();
    const index = current.findIndex(p => p.id === player.id);

    if (index >= 0) {
      // Remove
      this.selectedPlayers.set(current.filter(p => p.id !== player.id));
    } else {
      // Add
      this.selectedPlayers.set([...current, player]);
    }
  }

  quickAddPlayer() {
    if (!this.quickPlayerName.trim()) return;

    this.clearError();
    const name = this.quickPlayerName.trim();

    this.api.createPlayer(name).subscribe({
      next: (newPlayer) => {
        this.quickPlayerName = '';
        // Add to available list
        this.availablePlayers.set([...this.availablePlayers(), newPlayer].sort((a,b) => a.name.localeCompare(b.name)));
        // Auto-select the newly added player at the end
        this.selectedPlayers.set([...this.selectedPlayers(), newPlayer]);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Kan speler niet toevoegen.');
      }
    });
  }

  clearError() {
    this.errorMessage.set('');
  }

  startGame() {
    if (this.selectedPlayers().length < 2) {
      this.errorMessage.set('Je hebt minimaal 2 spelers nodig om een spel te starten.');
      return;
    }
    if (!this.gameName.trim()) {
      this.errorMessage.set('Voer een geldige spelnaam in.');
      return;
    }

    this.clearError();
    this.starting.set(true);

    // 1. Create the game
    this.api.createGame(this.gameName.trim()).subscribe({
      next: (game) => {
        // 2. Add players sequentially or concurrently. ForkJoin is perfect for concurrent adding!
        const addPlayerRequests = this.selectedPlayers().map((player, index) => 
          this.api.addPlayerToGame(game.id, player.id, index + 1)
        );

        forkJoin(addPlayerRequests).subscribe({
          next: () => {
            this.starting.set(false);
            // Redirect to the newly created game detail page!
            this.router.navigate(['/game', game.id]);
          },
          error: (err) => {
            this.starting.set(false);
            this.errorMessage.set(err.error?.message || 'Fout bij het toevoegen van spelers aan het spel.');
          }
        });
      },
      error: (err) => {
        this.starting.set(false);
        this.errorMessage.set(err.error?.message || 'Fout bij het aanmaken van het spel.');
      }
    });
  }
}
