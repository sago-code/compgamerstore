import { Component, OnInit, OnDestroy, ElementRef, Renderer2, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from "@ionic/angular";
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SessionService } from 'src/app/services/session.service';
import { filter } from 'rxjs/operators';
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
      }
    };

    anchors.forEach((a) => {
      const off = this.renderer.listen(a, 'click', handler);
      this.removeListeners.push(off);
    });
  }

  ngOnDestroy(): void {
    this.removeListeners.forEach((off) => off());
    this.removeListeners = [];
    if (this.navSub) this.navSub.unsubscribe();
  }
}
