import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminUsersStateService {
  private modeSubject = new BehaviorSubject<'create' | 'edit'>('create');
  private userIdSubject = new BehaviorSubject<string | null>(null);

  setMode(mode: 'create' | 'edit'): void {
    this.modeSubject.next(mode);
  }

  getMode(): Observable<'create' | 'edit'> {
    return this.modeSubject.asObservable();
  }

  setEditingUserId(uid: string | null): void {
    this.userIdSubject.next(uid);
  }

  getEditingUserId(): Observable<string | null> {
    return this.userIdSubject.asObservable();
  }

  clear(): void {
    this.modeSubject.next('create');
    this.userIdSubject.next(null);
  }
}