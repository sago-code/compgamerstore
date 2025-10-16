import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { User } from 'src/app/models/user.model';
import { UserFirebaseService } from 'src/app/services/firebase/users/users.service';

@Injectable({ providedIn: 'root' })
export class UsersSearchService {
  private term$ = new BehaviorSubject<string>('');
  private refresh$ = new BehaviorSubject<void>(undefined);

  constructor(private userService: UserFirebaseService) {}

  setTerm(term: string): void {
    this.term$.next(term ?? '');
  }

  clear(): void {
    this.term$.next('');
  }

  refresh(): void {
    this.refresh$.next(undefined);
  }

  get results$(): Observable<User[]> {
    return combineLatest([
      this.term$.pipe(
        map(t => (t ?? '').trim()),
        debounceTime(250),
        distinctUntilChanged()
      ),
      this.refresh$
    ]).pipe(
      switchMap(([term]) =>
        term
          ? this.userService.searchAdminUsers(term)
          : this.userService.getAdminUsers()
      ),
      map(users => this.sortUsers(users))
    );
  }

  private sortUsers(users: User[]): User[] {
    return [...users].sort((a: User, b: User) => {
      const nameA = (a.first_name || '').toLowerCase();
      const nameB = (b.first_name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;

      const lastNameA = (a.last_name || '').toLowerCase();
      const lastNameB = (b.last_name || '').toLowerCase();
      if (lastNameA < lastNameB) return -1;
      if (lastNameA > lastNameB) return 1;

      const dateA = a.created_at ? (a.created_at as any).toDate?.() || new Date(0) : new Date(0);
      const dateB = b.created_at ? (b.created_at as any).toDate?.() || new Date(0) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }
}