import { Component } from '@angular/core';
import { IonItem, IonList, IonSelect, IonSelectOption } from '@ionic/angular/standalone';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {

  constructor() { }

  customActionSheetOptions = {
    header: 'Tipo de documento',
    subHeader: 'Seleciona el tipo de documento',
  };

  customDepartamentActionSheetOptions = {
    header: 'Ciudad de residencia',
    subHeader: 'Seleciona la ciudad de residencia',
  };
  valueDepartament : ItemDepartament[] = [
    { text: 'Bogotá', value: '11' },
    { text: 'Antioquia', value: '05' },
    { text: 'Cundinamarca', value: '25' },
    { text: 'Valle del Cauca', value: '76' },
    { text: 'Atlántico', value: '08' }
  ];

  customMunicipalityActionSheetOptions = {
    header: 'Municipio de residencia',
    subHeader: 'Seleciona la municipio de residencia',
  };

  valueCity : string = '';
  valueMunicipalityTotal : ItemMunicipality[] = [
    { text: 'BOGOTA, D.C.', value: '001', codDepartament: '11' },
    { text: 'MEDELLIN', value: '002', codDepartament: '05' },
    { text: 'CALI', value: '003', codDepartament: '76' },
    { text: 'BARRANQUILLA', value: '004', codDepartament: '08' },
    { text: 'IBAGUE', value: '005', codDepartament: '25' }
  ];
  valueMunicipality : ItemMunicipality[] = this.valueMunicipalityTotal;

  fruitSelectionChanged(fruits: string[]) {
    this.valueMunicipality = this.valueMunicipalityTotal.filter(municipality =>
      fruits.includes(municipality.codDepartament)
    );
  }

  activarLoginForm() {
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    const transisionActive = document.querySelector('.transision');
    if (loginForm && registerForm && transisionActive) {
      if (loginForm.classList.contains('loginDesactive')) {
        loginForm.classList.remove('loginDesactive');
        loginForm.classList.add('loginActive');
      }else {
        loginForm.classList.remove('loginActive');
        loginForm.classList.add('loginDesactive');
        transisionActive.classList.add('transisionActive');
      }
      if (registerForm.classList.contains('registerActive')) {
        registerForm.classList.remove('registerActive');
        registerForm.classList.add('registerDesactive');
      }else {
        registerForm.classList.add('registerActive');
        registerForm.classList.remove('registerDesactive');
      }
    }

    setTimeout(() => {
      if (transisionActive) {
      transisionActive.classList.remove('transisionActive');
      }
    }, 1000);
  }
}

export interface ItemDepartament {
  text: string;
  value: string;
}

export interface ItemMunicipality {
  text: string;
  value: string;
  codDepartament: string;
}
