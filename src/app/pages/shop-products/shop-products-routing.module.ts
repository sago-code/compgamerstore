import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShopProductsPage } from './shop-products.page';

const routes: Routes = [
  {
    path: '',
    component: ShopProductsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShopProductsPageRoutingModule {}
