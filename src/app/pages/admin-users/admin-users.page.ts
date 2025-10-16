import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonInput } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
import { UserFirebaseService } from 'src/app/services/firebase/users/users.service';
import { AdminUsersStateService } from 'src/app/services/state/admin-users-state.service';
import { Subscription } from 'rxjs';
import { UsersSearchService } from 'src/app/services/state/users-search.service';
import { LoadingService } from 'src/app/loading-service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss'],
  standalone: false
})
export class AdminUsersPage implements OnInit, OnDestroy {
  searchActive = false;
  private removeClickListener: (() => void) | null = null;

  @ViewChild('searchInput', { read: IonInput }) searchInput!: IonInput;
  @ViewChild('header') headerRef!: ElementRef<HTMLElement>;
  users: User[] = [];
  private usersSub?: Subscription;

  activarBusqueda() {
    this.searchActive = true;

    setTimeout(async () => {
      if (this.searchInput) {
        const nativeInput = await this.searchInput.getInputElement();
        nativeInput.focus();
      }
    }, 0);

    if (!this.removeClickListener) {
      this.removeClickListener = this.renderer.listen('document', 'click', (event: Event) => {
        const target = event.target as Node;
        const headerEl = document.querySelector('ion-header');
        if (headerEl && !headerEl.contains(target)) {
          this.cerrarBusqueda();
        }
      });
    }
  }

  private sortUsersList(users: User[]): User[] {
    const getDate = (u: User) => {
      const ts: any = (u as any).created_at;
      if (!ts) return new Date(0);
      return typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
    };

    return [...users].sort((a, b) => {
      const aFirst = (a.first_name || '').toLowerCase();
      const bFirst = (b.first_name || '').toLowerCase();
      if (aFirst < bFirst) return -1;
      if (aFirst > bFirst) return 1;

      const aLast = (a.last_name || '').toLowerCase();
      const bLast = (b.last_name || '').toLowerCase();
      if (aLast < bLast) return -1;
      if (aLast > bLast) return 1;

      return getDate(b).getTime() - getDate(a).getTime();
    });
  }
  
  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private router: Router,
    private userService: UserFirebaseService,
    private adminUsersState: AdminUsersStateService,
    private usersSearch: UsersSearchService,
    private alertController: AlertController,
    private loadingService: LoadingService,
  ) 
  { }

  
  ngOnInit() {
    this.loadAdminUsers();
    this.setupSearchSubscription();
  }
  // Nuevo: refresca la lista cuando la página será mostrada nuevamente
  ionViewWillEnter() {
      this.usersSearch.refresh();
  }

  async loadAdminUsers() {
    try {
      this.users = await this.userService.getAdminUsers();
      this.users = this.sortUsersList(this.users);
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  }

  private setupSearchSubscription() {
    // Suscríbete al servicio compartido de búsqueda
    this.usersSub = this.usersSearch.results$.subscribe({
      next: (users) => (this.users = users),
      error: (err) => console.error('Error searching users:', err),
    });
  }

  onSearchInput(evt: Event) {
    const ce = evt as CustomEvent<{ value: string }>;
    const value =
      (ce.detail && typeof ce.detail.value === 'string' ? ce.detail.value : '') ||
      ((evt.target as HTMLInputElement)?.value ?? '');
    this.usersSearch.setTerm(value);
  }

  cerrarBusqueda() {
    this.searchActive = false;
    setTimeout(async () => {
      if (this.searchInput) {
        this.searchInput.value = '';
        const nativeInput = await this.searchInput.getInputElement();
        nativeInput.blur();
      }
      // Reinicia el término de búsqueda desde el servicio compartido
      this.usersSearch.clear();
    }, 0);

    if (this.removeClickListener) {
      this.removeClickListener();
      this.removeClickListener = null;
    }
  }

  ngOnDestroy() {
    if (this.removeClickListener) {
      this.removeClickListener();
    }
    this.usersSub?.unsubscribe();
  }

  navigateToCreate() {
    this.adminUsersState.clear();
    this.adminUsersState.setMode('create');
    this.router.navigate(['/admin-users/form-users']);
  }

  editUser(user: User) {
    this.adminUsersState.setMode('edit');
    this.adminUsersState.setEditingUserId(user.uid);
    this.router.navigate(['/admin-users/form-users']);
  }

  async softDeleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Deseas desactivar el usuario "${user.first_name} ${user.last_name}"?, esta accion se puede revertir`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          handler: () => {
            this.userService.softDeleteUser(user.uid).then(() => {
              this.loadAdminUsers();
              this.loadingService.show();
              setTimeout(() => {
                this.loadingService.hide();
              }, 500);
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async restoreUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Restaurar el usuario "${user.first_name} ${user.last_name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Restaurar',
          handler: () => {
            this.userService.restoreUser(user.uid).then(() => {
              this.loadAdminUsers();
              this.loadingService.show();
              setTimeout(() => {
                this.loadingService.hide();
              }, 500);
            });
          }
        }
      ]
    });

    await alert.present();
  }
}  
