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
  signInWithCredential,
  deleteUser,
  updatePassword
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
  getDocs,
  orderBy,
  startAt,
  endAt,
  limit,
  deleteDoc
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
      email_lower: (rest.email || '').toLowerCase(),
      first_name_lower: (rest.first_name || '').toLowerCase(),
      last_name_lower: (rest.last_name || '').toLowerCase(),
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
  // Class: UserFirebaseService
  async loginWithGoogle(): Promise<
    | { exists: true; session: any }
    | { exists: false; session: any }
  > {
      // 🔹 Login con Google (Capacitor Social Login) sin scopes en Android
      const res: any = await SocialLogin.login({
        provider: 'google',
        options: {},
      });
  
      const idToken = res?.result?.idToken;
      const accessToken = res?.result?.accessToken;
      const profile = res?.result?.profile || {};
      const email = profile?.email || res?.result?.email || '';
  
      if (!idToken && !accessToken) {
        throw new Error('No se obtuvo token de Google');
      }
  
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const userCred = await signInWithCredential(this.auth, credential);
  
      const firebaseUser = userCred.user;
      const token = await getIdToken(firebaseUser, true);
  
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

  async getAdminUsers(): Promise<User[]> {
    const usersRef = collection(this.db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'));
    const querySnap = await getDocs(q);
    return querySnap.docs.map(doc => doc.data() as User);
  }

  async getAdminUser(uid: string): Promise<User | null> {
    const user = await this.getUserProfile(uid);
    if (user?.role === 'admin') return user;
    return null;
  }

  async updateUser(uid: string, user: Partial<User>): Promise<void> {
    if (!uid) {
        throw new Error('UID inválido: no se puede actualizar sin UID');
    }
  
    const now = serverTimestamp();
    const data: any = { ...user, updated_at: now };
  
    // No guardar 'password' en Firestore
    delete data.password;
  
    // Si se cambia el email, validar que no exista en otro usuario y mantener el índice en minúsculas
    if (user.email !== undefined) {
        const newEmailLower = (user.email || '').toLowerCase();
  
        const usersRef = collection(this.db, 'users');
        const q = query(usersRef, where('email_lower', '==', newEmailLower));
        const snap = await getDocs(q);
        const conflict = snap.docs.some(d => d.id !== uid);
        if (conflict) {
            throw new Error('El correo ya está registrado por otro usuario');
        }
  
        data.email_lower = newEmailLower;
    }
  
    if (user.first_name !== undefined) {
        data.first_name_lower = (user.first_name || '').toLowerCase();
    }
    if (user.last_name !== undefined) {
        data.last_name_lower = (user.last_name || '').toLowerCase();
    }
  
    await setDoc(doc(this.db, 'users', uid), data, { merge: true });
  }

  async softDeleteUser(uid: string): Promise<void> {
    if (!uid) {
      throw new Error('UID inválido: no se puede desactivar sin UID');
    }
    await this.updateUser(uid, { deleted_at: serverTimestamp() });
  }

  async restoreUser(uid: string): Promise<void> {
    if (!uid) {
      throw new Error('UID inválido: no se puede restaurar sin UID');
    }
    await this.updateUser(uid, { deleted_at: null });
  }

  async hardDeleteUser(uid: string): Promise<void> {
    // 1) Borra el documento en Firestore
    await deleteDoc(doc(this.db, 'users', uid));

    const currentUser = this.auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      await deleteUser(currentUser);
      return;
    }
  }

  async searchAdminUsers(searchTerm: string): Promise<User[]> {
    const term = (searchTerm ?? '').trim().toLowerCase();
    const usersRef = collection(this.db, 'users');

    if (!term) {
      const qAll = query(usersRef, where('role', '==', 'admin'), orderBy('first_name_lower'), limit(50));
      const snapAll = await getDocs(qAll);
      return snapAll.docs.map(d => d.data() as User);
    }

    try {
      // Búsqueda escalable en servidor (requiere índice compuesto: role+email_lower)
      const q = query(
        usersRef,
        where('role', '==', 'admin'),
        orderBy('email_lower'),
        startAt(term),
        endAt(term + '\uf8ff'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as User);
    } catch (err: any) {
      // Fallback temporal sin índice: filtra en cliente
      const admins = await this.getAdminUsers();
      const startsWith = (v?: string) => (v || '').toLowerCase().startsWith(term);
      return admins.filter(u =>
        startsWith((u as any).email_lower ?? u.email) ||
        startsWith((u as any).first_name_lower ?? u.first_name) ||
        startsWith((u as any).last_name_lower ?? u.last_name)
      );
    }
  }

  async changePassword(uid: string, newPassword: string): Promise<void> {
    if (!uid) {
      throw new Error('UID inválido: no se puede cambiar la contraseña sin UID');
    }
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay usuario autenticado para cambiar la contraseña');
    }
    if (currentUser.uid !== uid) {
      throw new Error('Solo puedes cambiar la contraseña del usuario autenticado');
    }
    await updatePassword(currentUser, newPassword);
  }
}
