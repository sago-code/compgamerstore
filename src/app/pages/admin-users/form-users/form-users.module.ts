import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormUsersPageRoutingModule } from './form-users-routing.module';

import { FormUsersPage } from './form-users.page';

import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FormUsersPageRoutingModule
  ],
  declarations: [FormUsersPage]
})
export class FormUsersPageModule {}
