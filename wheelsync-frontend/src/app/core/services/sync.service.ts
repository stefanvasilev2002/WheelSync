import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OfflineDbService } from './offline-db.service';
import { MileageService } from './mileage.service';
import { FuelService } from './fuel.service';

@Injectable({ providedIn: 'root' })
export class SyncService implements OnDestroy {
  private readonly offlineDb = inject(OfflineDbService);
  private readonly mileageService = inject(MileageService);
  private readonly fuelService = inject(FuelService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isOnline = signal(navigator.onLine);
  readonly pendingCount = signal(0);
  readonly syncing = signal(false);

  private onlineHandler = () => {
    this.isOnline.set(true);
    this.syncPending();
  };

  private offlineHandler = () => {
    this.isOnline.set(false);
  };

  private swMessageHandler = (event: MessageEvent) => {
    if (event.data?.type === 'BACKGROUND_SYNC') {
      this.syncPending();
    }
  };

  constructor() {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    navigator.serviceWorker?.addEventListener('message', this.swMessageHandler);
    this.refreshPendingCount();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    navigator.serviceWorker?.removeEventListener('message', this.swMessageHandler);
  }

  refreshPendingCount(): void {
    this.offlineDb.countPending().then((count) => this.pendingCount.set(count));
  }

  async syncPending(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);

    let synced = 0;
    try {
      synced += await this.syncMileage();
      synced += await this.syncFuel();
      this.refreshPendingCount();

      if (synced > 0) {
        this.showSyncedMessage(synced);
      }
    } finally {
      this.syncing.set(false);
    }
  }

  private async syncMileage(): Promise<number> {
    const entries = await this.offlineDb.getPendingMileage();
    let count = 0;
    for (const entry of entries) {
      try {
        await new Promise<void>((resolve, reject) => {
          const { _id, _createdAt, ...request } = entry;
          this.mileageService.create(request).subscribe({
            next: async () => {
              await this.offlineDb.deletePendingMileage(_id);
              resolve();
            },
            error: reject
          });
        });
        count++;
      } catch {
        // Stop on first failure — will retry next time we're online
        break;
      }
    }
    return count;
  }

  private async syncFuel(): Promise<number> {
    const entries = await this.offlineDb.getPendingFuel();
    let count = 0;
    for (const entry of entries) {
      try {
        await new Promise<void>((resolve, reject) => {
          const { _id, _createdAt, ...request } = entry;
          this.fuelService.create(request).subscribe({
            next: async () => {
              await this.offlineDb.deletePendingFuel(_id);
              resolve();
            },
            error: reject
          });
        });
        count++;
      } catch {
        break;
      }
    }
    return count;
  }

  showOfflineSavedMessage(): void {
    this.snackBar.open(
      'Нема конекција — записот е зачуван локално и ќе се синхронизира автоматски.',
      'OK',
      { duration: 5000 }
    );
    this.refreshPendingCount();
  }

  showSyncedMessage(count: number): void {
    this.snackBar.open(
      `${count} запис${count === 1 ? '' : 'и'} синхронизиран${count === 1 ? '' : 'и'} со серверот.`,
      'OK',
      { duration: 3000 }
    );
  }
}
