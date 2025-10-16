import { Injectable } from '@angular/core';
import {
  getAuth,
  linkWithCredential,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { SocialLogin } from '@capgo/capacitor-social-login';

@Injectable({ providedIn: 'root' })
export class AccountLinkFirebaseService {
  private isNative(): boolean {
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  }

  // Class: AccountLinkFirebaseService
  async linkGoogle(): Promise<{ uid: string; providers: string[] }> {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No hay usuario autenticado.');

    let credential: ReturnType<typeof GoogleAuthProvider.credential> | null = null;

    if (this.isNative()) {
      const res: any = await SocialLogin.login({
        provider: 'google',
        options: {},
      });
      const idToken = res?.result?.idToken;
      const accessToken = res?.result?.accessToken;
      if (!idToken && !accessToken) throw new Error('No se obtuvo token de Google.');
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
    } else {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const oauthCred = GoogleAuthProvider.credentialFromResult(result);
      if (!oauthCred) throw new Error('No se obtuvo credencial de Google (web).');
      credential = oauthCred;
    }

    try {
      await reauthenticateWithCredential(currentUser, credential).catch(() => {});
      const linkedUserCred = await linkWithCredential(currentUser, credential);
      const providers = (linkedUserCred.user.providerData || []).map(p => p.providerId);
      return { uid: linkedUserCred.user.uid, providers };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/credential-already-in-use') {
        throw new Error('La cuenta de Google ya está vinculada a otra cuenta. Inicia sesión con Google y desde esa sesión usa "Sincronizar con correo".');
      }
      if (code === 'auth/requires-recent-login') {
        throw new Error('Por seguridad, inicia sesión nuevamente y vuelve a intentar sincronizar Google.');
      }
      throw err;
    }
  }

  async linkEmailPassword(email: string, password: string): Promise<{ uid: string; providers: string[] }> {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No hay usuario autenticado.');
    if (!email || !password) throw new Error('Debes ingresar correo y contraseña.');

    const credential = EmailAuthProvider.credential(email, password);

    try {
      await reauthenticateWithCredential(currentUser, credential).catch(() => {});
      const linkedUserCred = await linkWithCredential(currentUser, credential);
      const providers = (linkedUserCred.user.providerData || []).map(p => p.providerId);
      return { uid: linkedUserCred.user.uid, providers };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/credential-already-in-use') {
        throw new Error('Este correo ya está vinculado a otra cuenta. Inicia sesión con correo y desde esa sesión usa "Sincronizar con Google".');
      }
      if (code === 'auth/requires-recent-login') {
        throw new Error('Por seguridad, inicia sesión nuevamente y vuelve a intentar sincronizar tu correo.');
      }
      if (code === 'auth/email-already-in-use') {
        throw new Error('El correo ya está en uso por otra cuenta.');
      }
      throw err;
    }
  }
}