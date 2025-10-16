import { Component, OnInit } from '@angular/core';
import { SessionService } from './services/session.service';
import { UserFirebaseService } from './services/firebase/users/users.service';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { SocialLogin } from '@capgo/capacitor-social-login';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private session: SessionService,
    private firebaseSvc: UserFirebaseService,
  ) {}
  async ngOnInit() {
    await this.initializeGoogle();
     // Mantiene sincronía real con Auth y PVC
    onAuthStateChanged(getAuth(), async user => {
      if (!user) {
        // Solo borra sesión local al logout real
        await this.session.clearSession();
      } else {
        // Si existe usuario en Auth pero NO hay en storage o el UID no coincide, reconstruye el caché local
        const local = await this.session.getSession();
        if (!local || local.uid !== user.uid) {
          // Trae perfil completo
          const profile = await this.firebaseSvc.getUserProfile(user.uid);
          const payload = {
            uid: user.uid,
            email: user.email || '',
            token: await user.getIdToken(),
            role: profile?.role || null,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            phone: profile?.phone || '',
            photo: profile?.photo || ''
          };
          await this.session.setSession(payload);
        }
      }
    });
  }

  // Clase: AppComponent
  private async initializeGoogle() {
    await SocialLogin.initialize({
      google: {
        webClientId: '840480061585-volnvfuoup0in8jbkrg2he59109p1arp.apps.googleusercontent.com',
        iOSClientId: '840480061585-71s9v9ng34na3ll2q140ll8vlgjbrul3.apps.googleusercontent.com',
        mode: 'online',
      },
    });
  }
}
