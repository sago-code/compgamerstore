import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormUsersPage } from './form-users.page';

const routes: Routes = [
  {
    path: '',
    component: FormUsersPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormUsersPageRoutingModule {}
