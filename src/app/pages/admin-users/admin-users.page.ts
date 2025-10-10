import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonInput } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
import { UserFirebaseService } from 'src/app/services/firebase/users/users.service';

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
  
  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private router: Router,
    private userService: UserFirebaseService
  ) 
  { }

  
  ngOnInit() {
    this.loadAdminUsers();
  }

  async loadAdminUsers() {
    try {
      this.users = await this.userService.getAdminUsers();
      this.users.sort((a: User, b: User) => {
        const nameA = a.first_name.toLowerCase();
        const nameB = b.first_name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;

        const lastNameA = a.last_name.toLowerCase();
        const lastNameB = b.last_name.toLowerCase();
        if (lastNameA < lastNameB) return -1;
        if (lastNameA > lastNameB) return 1;

        const dateA = a.created_at ? (a.created_at as any).toDate?.() || new Date(0) : new Date(0);
        const dateB = b.created_at ? (b.created_at as any).toDate?.() || new Date(0) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  }

  activarBusqueda() {
    this.searchActive = !this.searchActive;
    if (this.searchActive) {
      setTimeout(async () => {
        const nativeInput = await this.searchInput.getInputElement();
        nativeInput.focus();
      });

      this.removeClickListener = this.renderer.listen('document', 'mousedown', (event) => {
        if (this.headerRef && !this.headerRef.nativeElement.contains(event.target as Node)) {
          this.cerrarBusqueda();
        }
      });
    } else {
      this.cerrarBusqueda();
    }
  }

  cerrarBusqueda() {
    this.searchActive = false;
    setTimeout(async () => {
      if (this.searchInput) {
        this.searchInput.value = '';
        const nativeInput = await this.searchInput.getInputElement();
        nativeInput.blur();
      }
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
  }

  navigateToCreate() {
    this.router.navigate(['/admin-users/form-users'], {
      queryParams: {
        mode: 'create',
      }
    });
  }

  editUser(user: User) {
    this.router.navigateByUrl('/admin-users/form-users', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/admin-users/form-users'], {
        queryParams: {
          mode: 'edit',
          userId: user.uid,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    });
  }
}
