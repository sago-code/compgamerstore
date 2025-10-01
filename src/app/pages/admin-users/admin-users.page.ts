import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { IonInput } from '@ionic/angular';

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

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
  }

}
