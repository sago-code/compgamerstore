import { Component, OnInit, OnDestroy, ElementRef, Renderer2, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from "@ionic/angular";
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SessionService } from 'src/app/services/session.service';
import { filter } from 'rxjs/operators';
import { timer } from 'rxjs';
import { getAuth } from 'firebase/auth';

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

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private session: SessionService,
    private router: Router
  ) {}

  ngOnInit() {
    // Cargar estado al crear el menú
    this.updateSession();
    // Siempre recargar sesión ACTUAL tras cualquier navegación
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.updateSession());
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


  async logout() {
    const host = this.el.nativeElement as HTMLElement;

    const ul = host.querySelector('ul:not([hidden])');
    if (!ul) return;
    const items = ul.querySelectorAll('.list') as NodeListOf<HTMLElement>;

    const handler = () => {
      items.forEach(item => item.classList.remove('active'));

      const anchor = ul.querySelector('.logout');
      const targetLi = anchor.closest('.list') as HTMLElement | null;
      if (targetLi) {
        targetLi.classList.add('active');
        this.onSoping(false);
      }
    };
    handler();
    timer(10).subscribe(async () => {
      await this.session.clearSession();
      alert('cierras sesión');
      getAuth().signOut().then(() => {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      });
    });
  }
}
