// AccountLinkService (servicio compartido)
import { Injectable } from '@angular/core';
import { AccountLinkFirebaseService } from 'src/app/services/firebase/auth/account-link-firebase.service';

@Injectable({ providedIn: 'root' })
export class AccountLinkService {
  constructor(private firebaseLink: AccountLinkFirebaseService) {}

  linkGoogle(): Promise<{ uid: string; providers: string[] }> {
    return this.firebaseLink.linkGoogle();
  }

  linkEmailPassword(email: string, password: string): Promise<{ uid: string; providers: string[] }> {
    return this.firebaseLink.linkEmailPassword(email, password);
  }
}