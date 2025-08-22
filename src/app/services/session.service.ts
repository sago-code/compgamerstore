import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface SessionPayload {
  uid: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly KEY = 'auth_user';

  async setSession(payload: SessionPayload): Promise<void> {
    const value = JSON.stringify(payload);
    try {
      await Preferences.set({ key: this.KEY, value });
    } catch {
      try { localStorage.setItem(this.KEY, value); } catch {}
    }
  }

  async getSession<T = SessionPayload>(): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key: this.KEY });
      if (value) return JSON.parse(value) as T;
    } catch {}
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async clearSession(): Promise<void> {
    try { await Preferences.remove({ key: this.KEY }); } catch {}
    try { localStorage.removeItem(this.KEY); } catch {}
  }
}