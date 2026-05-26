import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SyncService } from './core/services/sync.service';

@Component({
  selector: 'ws-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent implements OnInit {
  // Inject SyncService to start online/offline listeners and trigger initial sync
  private readonly syncService = inject(SyncService);

  ngOnInit(): void {
    // If the app starts online with pending entries (e.g. from a previous offline session),
    // sync them immediately.
    if (navigator.onLine) {
      this.syncService.syncPending();
    }
  }
}
