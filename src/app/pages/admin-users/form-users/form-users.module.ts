import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormUsersPageRoutingModule } from './form-users-routing.module';

import { FormUsersPage } from './form-users.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormUsersPageRoutingModule
  ],
  declarations: [FormUsersPage]
})
export class FormUsersPageModule {}
