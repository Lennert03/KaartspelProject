import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'players',
    loadComponent: () => import('./pages/players/players.component').then(m => m.PlayersComponent)
  },
  {
    path: 'new-game',
    loadComponent: () => import('./pages/new-game/new-game.component').then(m => m.NewGameComponent)
  },
  {
    path: 'game/:id',
    loadComponent: () => import('./pages/game/game.component').then(m => m.GameComponent)
  },
  {
    path: 'game/:id/new-round',
    loadComponent: () => import('./pages/new-round/new-round.component').then(m => m.NewRoundComponent)
  },
  {
    path: 'game/:id/round/:roundId/results',
    loadComponent: () => import('./pages/enter-results/enter-results.component').then(m => m.EnterResultsComponent)
  },
  {
    path: 'stats',
    loadComponent: () => import('./pages/stats/stats.component').then(m => m.StatsComponent)
  },
  { path: '**', redirectTo: 'home' }
];
