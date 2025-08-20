import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, getIdToken, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../../../models/user.model';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
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
    // 1) Crear usuario en Auth
    const cred = await createUserWithEmailAndPassword(this.auth, user.email, user.password);
    const uid = cred.user?.uid;
    if (!uid) throw new Error('No se pudo obtener el UID del usuario creado');

    // 2) Preparar payload (no guardar password)
    const { password, ...rest } = user as any;
    const profile = {
      ...rest,
      uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      deleted_at: null
    };

    // 3) Guardar en Firestore
    await setDoc(doc(this.db, 'users', uid), profile);
    return uid;
  }

  // Inicia sesión con email y password y retorna token
  async login(email: string, password: string): Promise<{ uid: string; token: string; email: string; }> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = cred.user?.uid || '';
    const token = await getIdToken(cred.user!, true);
    return { uid, token, email: cred.user?.email || email };
  }
}
