import { Injectable } from '@angular/core';
import { MileageLogRequest } from '../models/mileage.model';
import { FuelLogRequest } from '../models/fuel.model';

export type PendingMileageEntry = MileageLogRequest & { _id: number; _createdAt: number };
export type PendingFuelEntry = FuelLogRequest & { _id: number; _createdAt: number };

const DB_NAME = 'wheelsync-offline';
const DB_VERSION = 1;
const STORE_MILEAGE = 'pending_mileage';
const STORE_FUEL = 'pending_fuel';

@Injectable({ providedIn: 'root' })
export class OfflineDbService {
  private db: IDBDatabase | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MILEAGE)) {
          db.createObjectStore(STORE_MILEAGE, { keyPath: '_id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORE_FUEL)) {
          db.createObjectStore(STORE_FUEL, { keyPath: '_id', autoIncrement: true });
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // ─── Mileage ───────────────────────────────────────────────────────────────

  addPendingMileage(entry: MileageLogRequest): Promise<number> {
    return this.open().then((db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MILEAGE, 'readwrite');
        const req = tx.objectStore(STORE_MILEAGE).add({ ...entry, _createdAt: Date.now() });
        req.onsuccess = () => resolve(req.result as number);
        req.onerror = () => reject(req.error);
      })
    );
  }

  getPendingMileage(): Promise<PendingMileageEntry[]> {
    return this.open().then((db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MILEAGE, 'readonly');
        const req = tx.objectStore(STORE_MILEAGE).getAll();
        req.onsuccess = () => resolve(req.result as PendingMileageEntry[]);
        req.onerror = () => reject(req.error);
      })
    );
  }

  deletePendingMileage(id: number): Promise<void> {
    return this.open().then((db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MILEAGE, 'readwrite');
        const req = tx.objectStore(STORE_MILEAGE).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
    );
  }

  // ─── Fuel ──────────────────────────────────────────────────────────────────

  addPendingFuel(entry: FuelLogRequest): Promise<number> {
    return this.open().then((db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FUEL, 'readwrite');
        const req = tx.objectStore(STORE_FUEL).add({ ...entry, _createdAt: Date.now() });
        req.onsuccess = () => resolve(req.result as number);
        req.onerror = () => reject(req.error);
      })
    );
  }

  getPendingFuel(): Promise<PendingFuelEntry[]> {
    return this.open().then((db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FUEL, 'readonly');
        const req = tx.objectStore(STORE_FUEL).getAll();
        req.onsuccess = () => resolve(req.result as PendingFuelEntry[]);
        req.onerror = () => reject(req.error);
      })
    );
  }

  deletePendingFuel(id: number): Promise<void> {
    return this.open().then((db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FUEL, 'readwrite');
        const req = tx.objectStore(STORE_FUEL).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
    );
  }

  countPending(): Promise<number> {
    return Promise.all([
      this.getPendingMileage().then((e) => e.length),
      this.getPendingFuel().then((e) => e.length)
    ]).then(([m, f]) => m + f);
  }
}
