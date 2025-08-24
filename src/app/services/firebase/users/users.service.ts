import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, getIdToken, Auth, GoogleAuthProvider, UserCredential, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { User } from '../../../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserFirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    // Inicializar Firebase una sola vez usando el SDK modular (sin AngularFire)
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  // Registra al usuario en Firebase Auth y guarda su perfil en Firestore
  async registerUser(user: User): Promise<string> {
    let uid: string | undefined;
    const currentUser = getAuth().currentUser;

    if (currentUser) {
      // Si ya hay un usuario logueado (vía Google o lo que sea), solo crea el perfil en Firestore
      uid = currentUser.uid;
    } else {
      // Solo intenta crear en Auth si NO existe sesión activa
      const cred = await createUserWithEmailAndPassword(this.auth, user.email, user.password);
      uid = cred.user?.uid;
      if (!uid) throw new Error('No se pudo obtener el UID del usuario creado');
    }

    const { password, ...rest } = user as any;
    const profile = {
      ...rest,
      uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      deleted_at: null
    };

    // Usar merge:true para no sobreescribir nada si el doc existe
    await setDoc(doc(this.db, 'users', uid), profile, { merge: true });
    return uid;
  }

  // Inicia sesión con email y password y retorna token
  async login(email: string, password: string): Promise<{ uid: string; token: string; email: string; }> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = cred.user?.uid || '';
    const token = await getIdToken(cred.user!, true);
    return { uid, token, email: cred.user?.email || email };
  }

  async loginWithGoogle(): Promise<
    | { exists: true; session: any }
    | { exists: false; session: any }
  > {
    const provider = new GoogleAuthProvider();
    const cred: UserCredential = await signInWithPopup(this.auth, provider);
    const user = cred.user;
    const uid = user.uid;
    const token = await user.getIdToken();

    // Checa si existe en Firestore
    const userDocRef = doc(this.db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    // Prepara datos del usuario de Google
    let first_name = '', last_name = '';
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      first_name = parts[0];
      last_name = parts.slice(1).join(' ');
    }

    const sessionData = {
      uid,
      email: user.email || '',
      token,
      photo: user.photoURL || '',
      first_name,
      last_name
    };

    if (userSnap.exists()) {
      // Usuario ya existe, loguea directamente
      return { exists: true, session: { ...sessionData || undefined } };
    } else {
      // Usuario nuevo, redirige al registro
      return { exists: false, session: sessionData };
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
}

  async getUserProfile(uid: string): Promise<User | null> {
    const userDoc = await getDoc(doc(this.db, 'users', uid));
    if (userDoc.exists()) return userDoc.data() as User;
    return null;
  }
}
