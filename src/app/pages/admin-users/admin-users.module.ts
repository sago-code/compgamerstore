import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminUsersPageRoutingModule } from './admin-users-routing.module';

import { AdminUsersPage } from './admin-users.page';
import { MenupageComponent } from "src/app/components/menupage/menupage.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminUsersPageRoutingModule,
    MenupageComponent
],
  declarations: [AdminUsersPage]
})
export class AdminUsersPageModule {}
