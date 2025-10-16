// PerfilPage (clase)
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { getAuth, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { UserFirebaseService } from 'src/app/services/firebase/users/users.service';
import { AuthSessionService } from 'src/app/services/auth/auth-session.service';
import { LoadingService } from 'src/app/loading-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { Subscription, timer } from 'rxjs';
import { ItemDepartament, ItemMunicipality } from '../login/login.page';
import { AccountLinkService } from 'src/app/services/auth/account-link.service';
import { Router } from '@angular/router';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit, OnDestroy {

  customDepartamentActionSheetOptions = {
    header: 'Ciudad de residencia',
    subHeader: 'Seleciona la ciudad de residencia',
  };
  valueDepartament : ItemDepartament[] = [
    { text: 'Bogotá', value: '11' },
    { text: 'Antioquia', value: '05' },
    { text: 'Cundinamarca', value: '25' },
    { text: 'Valle del Cauca', value: '76' },
    { text: 'Atlántico', value: '08' }
  ];

  customMunicipalityActionSheetOptions = {
    header: 'Municipio de residencia',
    subHeader: 'Seleciona la municipio de residencia',
  };

  valueCity : string = '';
  valueMunicipalityTotal : ItemMunicipality[] = [
    { text: 'BOGOTA, D.C.', value: '001', codDepartament: '11' },
    { text: 'MEDELLIN', value: '002', codDepartament: '05' },
    { text: 'CALI', value: '003', codDepartament: '76' },
    { text: 'BARRANQUILLA', value: '004', codDepartament: '08' },
    { text: 'IBAGUE', value: '005', codDepartament: '25' }
  ];
  valueMunicipality : ItemMunicipality[] = this.valueMunicipalityTotal;

  // Mapea nombre <-> código para departamento
  private getDepartamentNameByCode(code?: string | null): string | null {
    if (!code) return null;
    const found = this.valueDepartament.find(d => d.value === code);
    return found?.text ?? null;
  }
  private getDepartamentCodeByName(name?: string | null): string | null {
    if (!name) return null;
    const found = this.valueDepartament.find(d => d.text === name);
    return found?.value ?? null;
  }

  // Mapea nombre <-> código para municipio
  private getMunicipalityNameByCode(code?: string | null): string | null {
    if (!code) return null;
    const found = this.valueMunicipalityTotal.find(m => m.value === code);
    return found?.text ?? null;
  }

  // Ajusta filtro de municipios para selección única o múltiple, recibiendo nombre
  fruitSelectionChanged(selection: string | string[]) {
    const selectedName = Array.isArray(selection) ? selection[0] : selection;
    const depCode = this.getDepartamentCodeByName(selectedName) ?? selectedName; // tolera si llega código
    this.valueMunicipality = this.valueMunicipalityTotal.filter(m => m.codDepartament === depCode);
  }
  
  // Agrego estado para el usuario y rol
  user: any | null = null;
  role: 'admin' | 'cliente' | null = null;
  authUnsub?: () => void;
  // Exponer observables del servicio compartido
  user$ = this.authSession.user$;
  role$ = this.authSession.role$;

  // Nuevo: estado y formulario para edición
  editing = false;
  profileForm: FormGroup;
  currentUid: string | null = null;

  // Bandera de proveedores vinculados (para deshabilitar y marcar botones)
  hasGoogleProvider = false;
  hasPasswordProvider = false;

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private authSession: AuthSessionService,
    private usersService: UserFirebaseService,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private accountLink: AccountLinkService,
    private el: ElementRef<HTMLElement>,
    private session: SessionService,
    private router: Router,
  ) {
    // Inicializa formulario de perfil editable (sólo campos solicitados)
    this.profileForm = this.fb.group({
      phone: ['', [Validators.pattern('^[0-9]+$')]],
      direction: [''],
      departament: [''],
      municipality: ['']
    });
  }

  changePassword() {
    this.authSession.user$.subscribe(user => {
      if (user) {
        // Lógica para cambiar contraseña
        // Puedes redirigir a una página de cambio de contraseña
        // o mostrar un modal para ingresar la nueva contraseña
      }
    });
  }

  ngOnInit() {
    // Suscríbete al estado de autenticación (persistente tras recargas)
    const auth = getAuth();
    this.loadingService.show();
    this.authUnsub = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser?.uid) {
        this.user = null;
        this.role = null;
        this.currentUid = null;
        this.loadingService.hide();
        return;
      }
      this.currentUid = authUser.uid;
      try {
        await this.loadProfile(authUser);
        this.refreshProviderFlags();
      } finally {
        this.loadingService.hide();
      }
    });
  }
  // Carga perfil y rol (manteniendo los mismos campos que el HTML actual)
  private async loadProfile(authUser: any) {
    try {
      const profile = await this.usersService.getUserProfile(authUser.uid);
      this.role = (profile?.role ?? 'cliente') as 'admin' | 'cliente';
      this.user = {
        photoURL: profile?.photo ?? authUser.photoURL ?? null,
        displayName: authUser.displayName ?? `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
        email: profile?.email ?? authUser.email ?? '',
        fullName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || authUser.displayName || ''
      };

      // Si en BD hay códigos, convertirlos a nombres para el formulario
      const depStored = profile?.departament ?? '';
      const munStored = profile?.municipality ?? '';
      const depText = this.getDepartamentNameByCode(depStored) ?? depStored;
      const munText = this.getMunicipalityNameByCode(munStored) ?? munStored;

      this.profileForm.patchValue({
        phone: profile?.phone != null ? String(profile.phone) : '',
        direction: profile?.direction ?? '',
        departament: depText,
        municipality: munText
      });

      // Actualiza el listado de municipios según el departamento inicial
      this.fruitSelectionChanged(depText);
      this.refreshProviderFlags();
    } catch {
      // Fallback mínimo si hay error al cargar el perfil
      this.role = 'cliente';
      this.user = {
        photoURL: authUser.photoURL ?? null,
        displayName: authUser.displayName ?? '',
        email: authUser.email ?? '',
        fullName: authUser.displayName ?? ''
      };
      // Resetea el formulario en fallback
      this.profileForm.reset({
        phone: '',
        direction: '',
        departament: '',
        municipality: ''
      });
    }
  }
  async onEditFab() {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Acciones de perfil',
      buttons: [
        {
          text: this.editing ? 'Salir de edición' : 'Editar perfil',
          icon: this.editing ? 'close-outline' : 'create-outline',
          handler: () => this.toggleEdit()
        },
        {
          text: 'Cambiar foto',
          icon: 'image-outline',
          handler: () => this.triggerPhotoSelect()
        },
        {
          text: 'Cambiar contraseña',
          icon: 'lock-closed-outline',
          handler: () => this.promptPasswordChange()
        },
        { text: 'Cancelar', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  // Prompt para solicitar contraseñas y ejecutar el cambio
  private async promptPasswordChange() {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar contraseña',
      inputs: [
        { name: 'current', type: 'password', placeholder: 'Contraseña actual' },
        { name: 'new', type: 'password', placeholder: 'Nueva contraseña' },
        { name: 'confirm', type: 'password', placeholder: 'Confirmar nueva contraseña' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            // ejecutar sin await dentro del handler
            this.performPasswordChange(data.current, data.new, data.confirm);
          }
        }
      ]
    });
    await alert.present();
  }

  // Lógica de cambio de contraseña con reautenticación si aplica
  private async performPasswordChange(currentPassword: string, newPassword: string, confirmPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('No hay usuario autenticado.');
      return;
    }

    this.loadingService.show();
    try {
      // Si el proveedor es email/password y el usuario ingresó la actual, reautenticar
      const usesPasswordProvider = (currentUser.providerData || []).some(p => p.providerId === 'password');
      if (usesPasswordProvider && currentPassword && currentUser.email) {
        const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, cred);
      }

      await updatePassword(currentUser, newPassword);
      alert('Contraseña actualizada correctamente.');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/requires-recent-login') {
        alert('Por seguridad, inicia sesión nuevamente y vuelve a intentar cambiar tu contraseña.');
      } else if (code === 'auth/wrong-password') {
        alert('La contraseña actual no es correcta.');
      } else {
        alert('No se pudo cambiar la contraseña: ' + (err?.message || err));
      }
    } finally {
      this.loadingService.hide();
    }
  }

  private triggerPhotoSelect() {
    this.photoInput?.nativeElement?.click();
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // reset para permitir re-selección
    if (!file || !this.currentUid) return;

    this.loadingService.show();
    try {
      const base64 = await this.compressImageToBase64(file, 800, 800, 1_000_000);
      await this.usersService.updateUser(this.currentUid, { photo: base64 });
      // Refrescar datos visibles
      const auth = getAuth().currentUser;
      if (auth?.uid) {
        await this.loadProfile(auth);
      }
    } catch (err: any) {
      alert('No se pudo actualizar la foto: ' + (err?.message || err));
    } finally {
      this.loadingService.hide();
    }
  }

  private async compressImageToBase64(file: File, maxW: number, maxH: number, maxBytes: number): Promise<string> {
    const dataUrl = await this.readFileAsDataURL(file);
    const img = await this.loadImage(dataUrl);

    // Calcular dimensiones manteniendo proporción
    let { width, height } = img;
    const scale = Math.min(maxW / width, maxH / height, 1); // no ampliar
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el contexto de canvas');

    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Reducir calidad hasta que cumpla <= maxBytes
    let quality = 0.92;
    let out = canvas.toDataURL('image/jpeg', quality);
    const minQuality = 0.5;
    while (this.dataUrlSize(out) > maxBytes && quality > minQuality) {
      quality -= 0.05;
      out = canvas.toDataURL('image/jpeg', quality);
    }
    if (this.dataUrlSize(out) > maxBytes) {
      throw new Error('La imagen no pudo comprimirse por debajo de 1MB');
    }
    return out; // base64 data URL
  }

  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private dataUrlSize(dataUrl: string): number {
    // Tamaño aproximado bytes de base64
    const head = 'base64,';
    const i = dataUrl.indexOf(head);
    const base64 = i >= 0 ? dataUrl.substring(i + head.length) : dataUrl;
    return Math.ceil((base64.length * 3) / 4);
  }

  toggleEdit() {
    this.editing = !this.editing;
  }
  cancelEdit() {
    this.editing = false;
    // Restaura valores desde el perfil cargado
    // (si ya sincronizas el formulario con user$, esto lo mantendrá coherente)
    const auth = getAuth().currentUser;
    if (auth?.uid) {
      this.loadProfile(auth);
    }
  }
  async saveChanges() {
    if (!this.currentUid) return;
    if (this.profileForm.invalid) {
      alert('Verifica los campos: teléfono debe ser numérico.');
      return;
    }
    this.loadingService.show();
    try {
      const form = this.profileForm.value as any;

      // Garantiza nombres en payload; si por alguna razón llegan códigos, mapéalos
      const departamentName =
        this.getDepartamentNameByCode(form.departament) ?? form.departament ?? undefined;
      const municipalityName =
        this.getMunicipalityNameByCode(form.municipality) ?? form.municipality ?? undefined;

      const payload = {
        phone: form.phone ? Number(form.phone) : undefined,
        direction: form.direction ?? undefined,
        departament: departamentName,
        municipality: municipalityName
      };

      await this.usersService.updateUser(this.currentUid, payload);
      alert('Perfil actualizado correctamente');
      this.editing = false;

      const auth = getAuth().currentUser;
      if (auth?.uid) {
        await this.loadProfile(auth);
      }
    } catch (err: any) {
      alert('Error al actualizar perfil: ' + (err?.message || err));
    } finally {
      this.loadingService.hide();
    }
  }
  profileSub?: Subscription;

  // Vincular Google al currentUser usando el servicio compartido
  async syncGoogleAccount() {
    this.loadingService.show();
    try {
      await this.accountLink.linkGoogle();
      alert('Cuenta de Google sincronizada correctamente.');
      this.refreshProviderFlags();
    } catch (err: any) {
      alert(err?.message || 'No se pudo sincronizar Google.');
    } finally {
      this.loadingService.hide();
    }
  }

  onSoping(valid) {
    const host = this.el.nativeElement as HTMLElement;

    const ul = host.querySelector('ul:not([hidden])');
    if (!ul) return;
    const items = ul.querySelectorAll('.list') as NodeListOf<HTMLElement>;

    const handler = () => {
      items.forEach(item => item.classList.remove('active'));

      const anchor = ul.querySelector('.onSoping');
      const targetLi = anchor.closest('.list') as HTMLElement | null;
      if (targetLi) {
        targetLi.classList.add('active');
        this.onSoping(false);
      }
    };

    const navSoping = host.querySelector('.navSoping');
    const navSoping1 = host.querySelector('.onSoping1');
    const navSoping2 = host.querySelector('.onSoping2');
    if (navSoping2 && valid !== false) {
      handler();
      navSoping2.classList.toggle('navSopingActive2');
    }else if (navSoping1 && valid !== false) {
      handler();
      navSoping1.classList.toggle('navSopingActive1');
    }else if (navSoping && valid !== false) {
      handler();
      navSoping.classList.toggle('navSopingActive');
    }else if (navSoping1 && !valid) {
      navSoping.classList.remove('navSopingActive');
      navSoping1.classList.remove('navSopingActive1');
    }else if (navSoping2 && !valid) {
      navSoping.classList.remove('navSopingActive');
      navSoping2.classList.remove('navSopingActive2');
    }else if (navSoping && !valid) {
      navSoping.classList.remove('navSopingActive');
    }
  }

  async confirmLogout() {
      const host = this.el.nativeElement as HTMLElement;
      const ul = host.querySelector('ul:not([hidden])');
      if (ul) {
          const items = ul.querySelectorAll('.list') as NodeListOf<HTMLElement>;
          items.forEach(item => item.classList.remove('active'));
          const targetLi = ul.querySelector('.logoutNav') as HTMLElement | null;
          if (targetLi) {
              targetLi.classList.add('active');
              this.onSoping(false);
          }
      }
  
      const alert = await this.alertCtrl.create({
          header: 'Cerrar sesión',
          message: '¿Quieres cerrar sesión?',
          buttons: [
              { text: 'Cancelar', role: 'cancel' },
              { text: 'Cerrar sesión', role: 'confirm' }
          ]
      });
      await alert.present();
  
      const { role } = await alert.onDidDismiss();
      if (role === 'confirm') {
          await this.logout();
      } else {
          this.restoreActiveMenuItem();
      }
  }
  
  private restoreActiveMenuItem() {
      const host = this.el.nativeElement as HTMLElement;
      const ul = host.querySelector('ul:not([hidden])');
      if (!ul) return;
      const items = ul.querySelectorAll('.list') as NodeListOf<HTMLElement>;
      items.forEach(i => i.classList.remove('active'));
  
      const pathOnly = this.router.url.split('?')[0];
      const firstSegment = pathOnly.replace(/^\//, '').split('/')[0] || 'home';
      const safeClass = `${firstSegment}Nav`;
  
      const itemNow = ul.querySelector(`.${safeClass}`) as HTMLElement | null;
      if (itemNow) {
          itemNow.classList.add('active');
      } else {
          ul.querySelector('.homeNav')?.classList.add('active');
      }
  }

  async logout() {
      const host = this.el.nativeElement as HTMLElement;
      const ul = host.querySelector('ul:not([hidden])');
      if (ul) {
          const items = ul.querySelectorAll('.list') as NodeListOf<HTMLElement>;
          items.forEach(item => item.classList.remove('active'));
          const targetLi = ul.querySelector('.logoutNav') as HTMLElement | null;
          if (targetLi) {
              targetLi.classList.add('active');
              this.onSoping(false);
          }
      }
  
      // Ejecutar limpieza y logout de Firebase y recargar al terminar
      timer(10).subscribe(async () => {
          try {
              await this.session.clearSession();
              await getAuth().signOut();
          } finally {
              this.router.navigateByUrl('/home', { replaceUrl: true })
                .then(() => setTimeout(() => window.location.reload(), 50));
          }
      });
  }

  // Solicita email/clave y vincula al currentUser usando el servicio compartido
  async syncEmailAccount() {
    const prompt = await this.alertCtrl.create({
      header: 'Sincronizar correo y clave',
      inputs: [
        { name: 'email', type: 'email', placeholder: 'Correo', value: this.user?.email || '' },
        { name: 'password', type: 'password', placeholder: 'Contraseña' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sincronizar',
          handler: (data) => {
            this.doLinkEmail(data?.email, data?.password);
          }
        }
      ]
    });
    await prompt.present();
  }

  private async doLinkEmail(email?: string, password?: string) {
    if (!email || !password) {
      alert('Debes ingresar correo y contraseña.');
      return;
    }
    this.loadingService.show();
    try {
      await this.accountLink.linkEmailPassword(email, password);
      alert('Correo y clave sincronizados correctamente.');
      this.refreshProviderFlags();
    } catch (err: any) {
      alert(err?.message || 'No se pudo sincronizar correo y clave.');
    } finally {
      this.loadingService.hide();
    }
  }

  private refreshProviderFlags() {
      const auth = getAuth();
      const user = auth.currentUser;
      const providers = (user?.providerData || []).map(p => p.providerId);
      this.hasGoogleProvider = providers.includes('google.com');
      this.hasPasswordProvider = providers.includes('password');
  }

  ngOnDestroy() {
    // Limpia la suscripción para evitar fugas de memoria
    if (this.authUnsub) {
      this.authUnsub();
      this.authUnsub = undefined;
    }
    if (this.profileSub) {
      this.profileSub.unsubscribe();
      this.profileSub = undefined;
    }
  }
}
