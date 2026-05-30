import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, Player } from '../../services/api.service';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-players',
  imports: [NgIf, NgFor, DatePipe, FormsModule],
  template: `
    <div class="players-container">
      <div class="header-with-action">
        <h1>Spelers Beheren</h1>
        <button (click)="openAddModal()" class="btn btn-primary btn-add-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Speler
        </button>
      </div>

      <p class="description">Voeg spelers toe die kunnen meespelen in je spellen. Hun all-time statistieken worden hier ook mee bijgehouden.</p>

      <!-- Error and Feedback banners -->
      <div *ngIf="errorMessage()" class="alert alert-danger">
        <span>{{ errorMessage() }}</span>
        <button (click)="clearError()" class="alert-close">×</button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-container">
        <div class="spinner"></div>
        <p>Spelers laden...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && players().length === 0" class="glass-card text-center empty-state">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        <h3>Nog geen spelers</h3>
        <p class="mb-3">Voeg je eerste speler toe om aan de slag te gaan!</p>
        <button (click)="openAddModal()" class="btn btn-primary btn-sm">Speler Toevoegen</button>
      </div>

      <!-- Players List -->
      <div *ngIf="!loading() && players().length > 0" class="players-list">
        <div *ngFor="let player of players()" class="glass-card player-row">
          <div class="player-details">
            <h3 class="player-name">{{ player.name }}</h3>
            <span class="player-joined">Toegevoegd op {{ player.createdAt | date:'dd-MM-yyyy' }}</span>
          </div>
          <div class="actions-group">
            <button (click)="openEditModal(player)" class="btn btn-secondary btn-icon-only" aria-label="Bewerken">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
              </svg>
            </button>
            <button (click)="deletePlayer(player)" class="btn btn-danger btn-icon-only" aria-label="Verwijderen">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal Overlay -->
      <div *ngIf="showModal()" class="modal-overlay">
        <div class="modal-container glass-card">
          <h2>{{ isEditing() ? 'Speler Aanpassen' : 'Nieuwe Speler' }}</h2>
          <form (submit)="savePlayer()">
            <div class="form-group">
              <label class="form-label" for="playerNameInput">Naam van de speler</label>
              <input
                id="playerNameInput"
                type="text"
                class="form-control"
                placeholder="Bijv. Lennert"
                [(ngModel)]="playerName"
                name="playerName"
                required
                maxlength="50"
                autoFocus
              />
            </div>
            
            <div class="modal-actions">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Annuleren</button>
              <button type="submit" class="btn btn-primary" [disabled]="!playerName.trim()">Opslaan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .players-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .header-with-action {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .btn-add-icon {
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-size: 0.9rem;
      width: auto;
    }

    .description {
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    /* Alerts styling */
    .alert {
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid transparent;
      margin-bottom: 0.5rem;
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

    .player-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      padding: 0.9rem 1.25rem;
    }

    .player-name {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 0;
    }

    .player-joined {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .actions-group {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon-only {
      width: 38px;
      height: 38px;
      padding: 0;
      border-radius: 10px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .modal-actions .btn {
      width: auto;
      padding: 0.75rem 1.25rem;
    }
  `]
})
export class PlayersComponent implements OnInit {
  private api = inject(ApiService);

  players = signal<Player[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  // Modal State
  showModal = signal(false);
  isEditing = signal(false);
  selectedPlayer: Player | null = null;
  playerName = '';

  ngOnInit() {
    this.loadPlayers();
  }

  loadPlayers() {
    this.loading.set(true);
    this.api.getPlayers().subscribe({
      next: (players) => {
        this.players.set(players);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddModal() {
    this.isEditing.set(false);
    this.selectedPlayer = null;
    this.playerName = '';
    this.showModal.set(true);
  }

  openEditModal(player: Player) {
    this.isEditing.set(true);
    this.selectedPlayer = player;
    this.playerName = player.name;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.playerName = '';
  }

  clearError() {
    this.errorMessage.set('');
  }

  savePlayer() {
    if (!this.playerName.trim()) return;

    this.clearError();
    const name = this.playerName.trim();

    if (this.isEditing() && this.selectedPlayer) {
      this.api.updatePlayer(this.selectedPlayer.id, name).subscribe({
        next: () => {
          this.closeModal();
          this.loadPlayers();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Fout bij bijwerken van speler.');
        }
      });
    } else {
      this.api.createPlayer(name).subscribe({
        next: () => {
          this.closeModal();
          this.loadPlayers();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Fout bij aanmaken van speler.');
        }
      });
    }
  }

  deletePlayer(player: Player) {
    if (confirm(`Weet je zeker dat je ${player.name} wilt verwijderen?`)) {
      this.clearError();
      this.api.deletePlayer(player.id).subscribe({
        next: () => {
          this.loadPlayers();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Kan speler niet verwijderen. Deze is waarschijnlijk gekoppeld aan een spel.');
        }
      });
    }
  }
}
