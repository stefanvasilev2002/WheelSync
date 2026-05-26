import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/push`;

  /** Call this after a user successfully logs in. */
  async requestAndSubscribe(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await this.sendSubscriptionToServer(existing);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(environment.vapidPublicKey)
      });

      await this.sendSubscriptionToServer(subscription);
    } catch (err) {
      console.warn('[WheelSync Push] Subscription failed:', err);
    }
  }

  /** Call this when the user logs out. */
  async unsubscribe(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      const body = this.subscriptionToDto(subscription);
      // Best-effort — fire and forget
      this.http.delete(`${this.baseUrl}/unsubscribe`, { body }).subscribe({ error: () => {} });
      await subscription.unsubscribe();
    } catch (err) {
      console.warn('[WheelSync Push] Unsubscribe failed:', err);
    }
  }

  private sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    return new Promise((resolve) => {
      this.http.post(`${this.baseUrl}/subscribe`, this.subscriptionToDto(subscription))
        .subscribe({ next: () => resolve(), error: () => resolve() });
    });
  }

  private subscriptionToDto(subscription: PushSubscription) {
    const json = subscription.toJSON();
    return {
      endpoint: subscription.endpoint,
      p256dh: json.keys?.['p256dh'] ?? '',
      auth: json.keys?.['auth'] ?? ''
    };
  }

  /** Converts a URL-safe base64 string to a Uint8Array (required by pushManager.subscribe). */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }
}
