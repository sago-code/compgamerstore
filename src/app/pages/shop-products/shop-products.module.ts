import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShopProductsPageRoutingModule } from './shop-products-routing.module';

import { ShopProductsPage } from './shop-products.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShopProductsPageRoutingModule
  ],
  declarations: [ShopProductsPage]
})
export class ShopProductsPageModule {}
