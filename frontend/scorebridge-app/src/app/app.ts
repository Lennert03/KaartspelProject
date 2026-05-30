import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgClass } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, NgClass],
  template: `
    <main class="app-container">
      <div class="app-content">
        <router-outlet></router-outlet>
      </div>

      <!-- Premium Sticky Footer Navigation -->
      <nav class="sticky-footer">
        <a routerLink="/home" class="nav-item" [ngClass]="{'active': currentRoute === '/home' || currentRoute === '/'}">
          <svg viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </a>
        <a routerLink="/players" class="nav-item" [ngClass]="{'active': currentRoute === '/players'}">
          <svg viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <span>Spelers</span>
        </a>
        <a routerLink="/stats" class="nav-item" [ngClass]="{'active': currentRoute === '/stats'}">
          <svg viewBox="0 0 24 24">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6.29-6.3 4 4 6.3-6.29L22 12V6z"/>
          </svg>
          <span>Stats</span>
        </a>
      </nav>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class App {
  private router = inject(Router);
  currentRoute = '/home';

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects;
    });
  }
}
