import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormproductPageRoutingModule } from './formproduct-routing.module';

import { FormproductPage } from './formproduct.page';
import { MenupageComponent } from "src/app/components/menupage/menupage.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormproductPageRoutingModule,
    MenupageComponent
],
  declarations: [FormproductPage]
})
export class FormproductPageModule {}
