import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShopProductsPageRoutingModule } from './shop-products-routing.module';

import { ShopProductsPage } from './shop-products.page';
import { MenupageComponent } from 'src/app/components/menupage/menupage.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShopProductsPageRoutingModule,
    MenupageComponent
  ],
  declarations: [ShopProductsPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ShopProductsPageModule {}
