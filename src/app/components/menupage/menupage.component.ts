import { Component, OnInit, OnDestroy, ElementRef, Renderer2, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from "@ionic/angular";
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SessionService } from 'src/app/services/session.service';
import { filter } from 'rxjs/operators';
import { timer } from 'rxjs';
import { getAuth } from 'firebase/auth';
import { LoadingService } from 'src/app/loading-service';

@Component({
  selector: 'app-menupage',
  templateUrl: './menupage.component.html',
  styleUrls: ['./menupage.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ],
})
export class MenupageComponent implements OnInit, AfterViewChecked, OnDestroy {
  private removeListeners: Array<() => void> = [];
  private navSub: any;
  isAuth = false;
  role: string | null = null;
  loadingActive = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private session: SessionService,
    private router: Router,
    private loadingService: LoadingService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Cargar estado al crear el menú
    this.updateSession();
    // Siempre recargar sesión ACTUAL tras cualquier navegación
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSession();

        setTimeout(() => {
          this.defocusHiddenPageElement();
          this.navNow();
        }, 100);
      });

    // Ejecutar navNow también al cargar la página (por recarga o redirección)
    this.navNow();

    this.loadingService.loading$.subscribe(active => {
      this.loadingActive = active;
      this.toggleLoading(active);
    });

  }

  async updateSession() {
    const s = await this.session.getSession<any>();
    this.isAuth = !!(s && s.uid);
    this.role = s?.role || null;
  }

  ngAfterViewChecked(): void {
    // Borrar listeners previos SIEMPRE antes de agregar nuevos
    this.removeListeners.forEach((off) => off());
    this.removeListeners = [];

    const host = this.el.nativeElement as HTMLElement;
    const ul = host.querySelector('ul:not([hidden])');
    if (!ul) return;
    const items = ul.querySelectorAll('.list') as NodeListOf<HTMLElement>;
    const anchors = ul.querySelectorAll('.list a') as NodeListOf<HTMLAnchorElement>;

    // Si NINGÚN li tiene .active, marca el primero por defecto (cuando cambian de menú)
    if (!ul.querySelector('.list.active') && items.length) {
      items[0].classList.add('active');
    }

    const handler = (ev: Event) => {
      const anchor = ev.currentTarget as HTMLAnchorElement;
      const shouldPrevent = !anchor.hasAttribute('data-route');
      if (shouldPrevent) {
        ev.preventDefault();
      }
      items.forEach(item => item.classList.remove('active'));
      const targetLi = anchor.closest('.list') as HTMLElement | null;
      if (targetLi) {
        targetLi.classList.add('active');
        this.onSoping(false);
      }
    };

    anchors.forEach((a) => {
      const off = this.renderer.listen(a, 'click', handler);
      this.removeListeners.push(off);
    });
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

  ngOnDestroy(): void {
    this.removeListeners.forEach((off) => off());
    this.removeListeners = [];
    if (this.navSub) this.navSub.unsubscribe();
  }


  // Mostrar confirmación y ejecutar logout sólo si el usuario acepta
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

    const alert = await this.alertController.create({
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
      // Ejecutar el cierre de sesión existente
      await this.logout();
    } else {
      // Restaurar el item activo acorde a la ruta actual
      this.navNow();
    }
  }

  async logout() {
    const host = this.el.nativeElement as HTMLElement;
    const ul = host.querySelector('ul:not([hidden])');
    if (!ul) return;

    const items = ul.querySelectorAll('.list') as NodeListOf<HTMLElement>;

    const handler = () => {
      items.forEach(item => item.classList.remove('active'));
      // Usar selector común para ambos menús (admin y cliente)
      const targetLi = ul.querySelector('.logoutNav') as HTMLElement | null;
      if (targetLi) {
        targetLi.classList.add('active');
        this.onSoping(false);
      }
    };

    handler();

    // Ejecutar limpieza y logout de Firebase
    timer(10).subscribe(async () => {
      try {
        await this.session.clearSession();
        await getAuth().signOut();
      } finally {
        // Navegar a home y forzar recarga para reiniciar completamente la UI
        this.router.navigateByUrl('/home', { replaceUrl: true }).then(() => {
          setTimeout(() => window.location.reload(), 50);
        });
      }
    });
  }

  colorInvert() {
    const root = document.documentElement;
    //colores claros
    const primary = getComputedStyle(root).getPropertyValue('--ion-color-primary').trim();
    const secondary = getComputedStyle(root).getPropertyValue('--ion-color-secondary').trim();
    const sextonary = getComputedStyle(root).getPropertyValue('--ion-color-sextonary').trim();
    const sextonaryV2 = getComputedStyle(root).getPropertyValue('--ion-color-chitonary-v2').trim();
    const denary = getComputedStyle(root).getPropertyValue('--ion-color-denary').trim();
    const undenary = getComputedStyle(root).getPropertyValue('--ion-color-undenary').trim();
    const quardenary = getComputedStyle(root).getPropertyValue('--ion-color-quardenary').trim();

    //colores oscuros
    const tertiary = getComputedStyle(root).getPropertyValue('--ion-color-tertiary').trim();
    const quaternary = getComputedStyle(root).getPropertyValue('--ion-color-quaternary').trim();
    const chitonary = getComputedStyle(root).getPropertyValue('--ion-color-chitonary').trim();
    const chitonaryV2 = getComputedStyle(root).getPropertyValue('--ion-color-chitonary-v2').trim();
    const novenary = getComputedStyle(root).getPropertyValue('--ion-color-novenary').trim();
    const duodenary = getComputedStyle(root).getPropertyValue('--ion-color-duodenary').trim();
    const tridenary = getComputedStyle(root).getPropertyValue('--ion-color-tridenary').trim();

    //de claro a oscuro
    root.style.setProperty('--ion-color-primary', quaternary);
    root.style.setProperty('--ion-color-secondary', tertiary);
    root.style.setProperty('--ion-color-chitonary', sextonary);
    root.style.setProperty('--ion-color-chitonary-v2', sextonaryV2);
    root.style.setProperty('--ion-color-denary', novenary);
    root.style.setProperty('--ion-color-undenary', duodenary);
    root.style.setProperty('--ion-color-quardenary', tridenary);

    //de oscuro a claro
    root.style.setProperty('--ion-color-quaternary', primary);
    root.style.setProperty('--ion-color-tertiary', secondary);
    root.style.setProperty('--ion-color-sextonary', chitonary);
    root.style.setProperty('--ion-color-sextonary-v2', chitonaryV2);
    root.style.setProperty('--ion-color-novenary', denary);
    root.style.setProperty('--ion-color-duodenary', undenary);
    root.style.setProperty('--ion-color-tridenary', quardenary);

    //Extras
    root.style.setProperty('--ion-color-septonary', sextonary);
    root.style.setProperty('--ion-color-octonary', denary);

    const items = document.querySelectorAll('.imgLogo') as NodeListOf<HTMLElement>;
    items.forEach(logo => {
      if (logo) {
      // Cambia la ruta de la imagen según el modo
      const currentSrc = logo.getAttribute('src') || '';
      if (currentSrc.includes('logo_dark')) {
        logo.setAttribute('src', currentSrc.replace('logo_dark', 'logo_light'));
      } else {
        logo.setAttribute('src', currentSrc.replace('logo_light', 'logo_dark'));
      }
      const currentSrsc = logo.getAttribute('src') || '';
    }
    });
  }

  toggleLoading(active: boolean) {
    const host = this.el.nativeElement as HTMLElement;
    const ul = host.querySelector('.contain-loading');
    if (active) {
      ul?.classList.add('active-loading');
    } else {
      ul?.classList.remove('active-loading');
    }
  }

  private defocusHiddenPageElement() {
    const activeEl = document.activeElement as HTMLElement | null;
    if (!activeEl) return;
    const hiddenAncestor = activeEl.closest('.ion-page-hidden,[aria-hidden="true"]');
    if (hiddenAncestor) {
      activeEl.blur();
      const visiblePage = document.querySelector('.ion-page:not(.ion-page-hidden)') as HTMLElement | null;
      if (visiblePage) {
        if (!visiblePage.hasAttribute('tabindex')) visiblePage.setAttribute('tabindex', '-1');
        visiblePage.focus();
      }
    }
  }

  navNow() {
    this.onSoping(false);
    this.defocusHiddenPageElement();
    const host = this.el.nativeElement as HTMLElement;
    const ul = host.querySelector('ul:not([hidden])');
    if (!ul) return;
    const items = ul.querySelectorAll('.list') as NodeListOf<HTMLElement>;
    items.forEach(item => item.classList.remove('active'));
 
    // Obtiene la ruta actual, elimina query params y toma solo el primer segmento
    const url = this.router.url; // e.g. "/admin-users/form-users?mode=create"
    const pathOnly = url.split('?')[0]; // "/admin-users/form-users"
    const firstSegment = pathOnly.replace(/^\//, '').split('/')[0] || 'home'; // "admin-users"
    const safeClass = `${firstSegment}Nav`; // "admin-usersNav"

    const itemNow = ul.querySelector(`.${safeClass}`) as HTMLElement | null;
    if (itemNow) {
      itemNow.classList.add('active');
    } else {
      // Fallback: marcar home si no se encuentra coincidencia
      const defaultItem = ul.querySelector('.homeNav') as HTMLElement | null;
      if (defaultItem) defaultItem.classList.add('active');
    }

    const handler = () => {
      const navSoping = host.querySelector('.navSoping');
      const onSoping1 = host.querySelector('.onSoping1');
      const navSoping2 = host.querySelector('.onSoping2');
      console.log(onSoping1);
      if (navSoping2) {
        navSoping2.classList.toggle('navSopingActive2');
      } else if (onSoping1) {
        onSoping1.classList.toggle('navSopingActive1');
      } else if (navSoping) {
        navSoping.classList.toggle('navSopingActive');
      }
    };

    // Activa el submenú solo en la sección de productos
    if (firstSegment === 'products') {
      handler();
    }
  }
}
