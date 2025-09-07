import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getIdToken,
  Auth,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { User } from '../../../models/user.model';
import { SocialLogin } from '@capgo/capacitor-social-login';

@Injectable({ providedIn: 'root' })
export class UserFirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    // Inicializar Firebase una sola vez usando el SDK modular (sin AngularFire)
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.auth.languageCode = 'es';
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

  // Login con Google usando SocialLogin
  async loginWithGoogle(): Promise<
    | { exists: true; session: any }
    | { exists: false; session: any }
  > {
    // 🔹 Login con Google (Capacitor Social Login)
    const res: any = await SocialLogin.login({
      provider: 'google',
      options: { scopes: ['profile', 'email'], forceRefreshToken: true },
    });

    const idToken = res?.result?.idToken;
    const accessToken = res?.result?.accessToken;
    const profile = res?.result?.profile || {};
    const email = profile?.email || res?.result?.email || '';

    if (!idToken && !accessToken) {
      throw new Error('No se obtuvo token de Google');
    }

    // Se crea el credencial en Firebase y autenticar (esto crea el usuario en Auth si no existe)
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCred = await signInWithCredential(this.auth, credential);

    const firebaseUser = userCred.user;
    const token = await getIdToken(firebaseUser, true);

    // Verifica si ya existe en Firestore (colección users)
    const usersRef = collection(this.db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnap = await getDocs(q);

    const exists = !querySnap.empty;
    const sessionData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      token,
      photo: firebaseUser.photoURL,
      name: firebaseUser.displayName,
    };

    if (exists) {
      return { exists: true, session: sessionData };
    } else {
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

