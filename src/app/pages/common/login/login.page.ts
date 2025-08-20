import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from 'src/app/services/firebase/users/users.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})

export class LoginPage implements OnInit {
  
  loadingRegister = false;

  //formulario de login
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  })

  // Formulario de registro de usuarios
  registerForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    confirm_password: new FormControl('', [Validators.required]),
    age: new FormControl('', [Validators.required, Validators.min(2)]),
    document_type: new FormControl('', [Validators.required]),
    document_number: new FormControl('', [Validators.required]),
    first_name: new FormControl('', [Validators.required]),
    last_name: new FormControl('', [Validators.required]),
    departament: new FormControl('', [Validators.required]),
    municipality: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    role: new FormControl('admin', [Validators.required])
  });

  constructor(private firebaseSvc: FirebaseService, private router: Router) {}

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

  // Activa el formulario de inicio de sesión
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

  // Activa el formulario de "Olvidaste tu contraseña"
  activarOlvidasteContrasenaForm() {
    const loginForm = document.querySelector('.login-form');
    const olvidasteContrasenaForm = document.querySelector('.olvidaste-contrasena-form');
    const transisionActive = document.querySelector('.transision');
    if (loginForm && olvidasteContrasenaForm && transisionActive) {
      if (loginForm.classList.contains('loginDesactive')) {
        loginForm.classList.remove('loginDesactive');
        loginForm.classList.add('loginActive');
      }else {
        loginForm.classList.remove('loginActive');
        loginForm.classList.add('loginDesactive');
        transisionActive.classList.add('transisionActive');
      }
      if (olvidasteContrasenaForm.classList.contains('olvidasteContrasenaActive')) {
        olvidasteContrasenaForm.classList.remove('olvidasteContrasenaActive');
        olvidasteContrasenaForm.classList.add('olvidasteContrasenaDesactive');
      }else {
        olvidasteContrasenaForm.classList.add('olvidasteContrasenaActive');
        olvidasteContrasenaForm.classList.remove('olvidasteContrasenaDesactive');
      }
    }

    setTimeout(() => {
      if (transisionActive) {
      transisionActive.classList.remove('transisionActive');
      }
    }, 1000);
  }

  // Registra un nuevo usuario
  async register() {
    if (this.registerForm.invalid) {
      alert('Por favor completa todos los campos correctamente.');
      return;
    }

    const form = this.registerForm.value as any;

    if (form.password !== form.confirm_password) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    this.loadingRegister = true;

    const user = {
      uid: '',
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      age: form.age,
      document_type: form.document_type,
      document_number: form.document_number,
      departament: form.departament,
      municipality: form.municipality,
      direction: form.address,
      role: form.role,
      created_at: null,
      updated_at: null,
      deleted_at: null
    } as any;

    try {
      const uid = await this.firebaseSvc.registerUser(user);
      // Iniciar sesión inmediatamente después del registro
      const session = await this.firebaseSvc.login(form.email, form.password);
      // Persistir sesión en localStorage y sessionStorage
      const payload = {
        uid: session.uid || uid,
        email: session.email,
        token: session.token,
        first_name: form.first_name,
        last_name: form.last_name,
        role: form.role
      };
      localStorage.setItem('auth_user', JSON.stringify(payload));
      sessionStorage.setItem('auth_user', JSON.stringify(payload));

      alert('Usuario registrado e inició sesión correctamente');
      this.registerForm.reset();
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (err: any) {
      alert('Error al registrar usuario: ' + (err?.message || err));
    } finally {
      this.loadingRegister = false;
    }
  }

  async login() {
    if (this.loginForm.invalid) {
      alert('Por favor completa todos los campos correctamente.');
      return;
    }

    const form = this.loginForm.value;

    try {
      const session = await this.firebaseSvc.login(form.email, form.password);
      // Persistir sesión en localStorage y sessionStorage
      const payload = {
        uid: session.uid,
        email: session.email,
        token: session.token
      };
      localStorage.setItem('auth_user', JSON.stringify(payload));
      sessionStorage.setItem('auth_user', JSON.stringify(payload));

      alert('Inicio de sesión exitoso');
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (err: any) {
      alert('Error al iniciar sesión: ' + (err?.message || err));
    }
  }

  ngOnInit(){
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
