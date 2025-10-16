import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { UserFirebaseService } from 'src/app/services/firebase/users/users.service';
import { User } from 'src/app/models/user.model';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { environment } from 'src/environments/environment';
import { getFirestore, Firestore, doc, onSnapshot } from 'firebase/firestore';

export interface ProfileView {
  photoURL: string | null;
  displayName: string;
  email: string;
  fullName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly user$ = new BehaviorSubject<ProfileView | null>(null);
  readonly role$ = new BehaviorSubject<'admin' | 'cliente' | null>(null);
  readonly profile$ = new BehaviorSubject<User | null>(null);

  private app: FirebaseApp;
  private db: Firestore;
  private authUnsub?: () => void;
  private profileUnsub?: () => void;

  constructor(private usersService: UserFirebaseService) {
    // Inicializa app/db (seguro si ya existe)
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.db = getFirestore(this.app);

    const auth = getAuth();
    this.authUnsub = onAuthStateChanged(auth, (authUser) => {
      if (!authUser?.uid) {
        this.user$.next(null);
        this.role$.next(null);
        this.profile$.next(null);
        if (this.profileUnsub) { this.profileUnsub(); this.profileUnsub = undefined; }
        return;
      }
      this.subscribeToUserDoc(authUser);
    });
  }

  private subscribeToUserDoc(authUser: FirebaseUser) {
    if (this.profileUnsub) { this.profileUnsub(); this.profileUnsub = undefined; }
    const ref = doc(this.db, 'users', authUser.uid);

    this.profileUnsub = onSnapshot(ref, (snap) => {
      const profile = snap.exists() ? (snap.data() as User) : null;
      this.profile$.next(profile);

      const role = (profile?.role ?? 'cliente') as 'admin' | 'cliente';
      this.role$.next(role);

      const view: ProfileView = {
        photoURL: profile?.photo ?? authUser.photoURL ?? null,
        displayName: authUser.displayName ?? `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
        email: profile?.email ?? authUser.email ?? '',
        fullName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || authUser.displayName || ''
      };
      this.user$.next(view);
    }, () => {
      // Fallback si falla el snapshot
      this.role$.next('cliente');
      this.profile$.next(null);
      const fallback: ProfileView = {
        photoURL: authUser.photoURL ?? null,
        displayName: authUser.displayName ?? '',
        email: authUser.email ?? '',
        fullName: authUser.displayName ?? ''
      };
      this.user$.next(fallback);
    });
  }
}