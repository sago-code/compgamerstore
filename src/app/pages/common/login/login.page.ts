import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserFirebaseService } from 'src/app/services/firebase/users/users.service';
import { Router } from '@angular/router';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})

export class LoginPage implements OnInit {
  
  loadingRegister = false;
  photoPreview: string | null = null;

  //formulario de login
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  })

  // Formulario de registro de usuarios
  registerForm = new FormGroup({
    phone: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
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
    role: new FormControl('admin', [Validators.required]),
    photo: new FormControl(null)
  });

  constructor(private firebaseSvc: UserFirebaseService, private router: Router, private session: SessionService) {}

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

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Selecciona solo archivos de imagen.');
        return;
      }
      this.registerForm.patchValue({ photo: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
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
      photo: this.photoPreview || '',
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      age: form.age,
      document_type: form.document_type,
      document_number: form.document_number,
      departament: form.departament,
      municipality: form.municipality,
      phone: form.phone,
      direction: form.address,
      role: form.role,
      created_at: null,
      updated_at: null,
      deleted_at: null
    } as any;

    try {
      let uid;
      const currentUser = this.firebaseSvc['auth'].currentUser || undefined;
      if (!currentUser) {
        // Crear usuario (email/password) y doc Firestore si NO hay sesión previa (email tradicional)
        uid = await this.firebaseSvc.registerUser(user);
        // Logueo después del registro
        const session = await this.firebaseSvc.login(form.email, form.password);
        const payload = {
          uid: session.uid || uid,
          email: session.email,
          token: session.token,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
          phone: form.phone,
          photo: this.photoPreview || ''
        };
        await this.session.setSession(payload);
      } else {
        // Ya AUTENTICADO (por Google), solo agrega/actualiza doc en /users, NO crea usuario de nuevo
        uid = await this.firebaseSvc.registerUser(user);
        // Usa los datos del formulario, NO los "viejos" de la sesión
        const payload = {
          uid: currentUser.uid,
          email: currentUser.email,
          token: await currentUser.getIdToken(),
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
          phone: form.phone,
          photo: this.photoPreview || ''
        };
        await this.session.setSession(payload);
      }
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
      // Hace login con email/clave
      const session = await this.firebaseSvc.login(form.email, form.password);

      // Ahora trae el perfil completo de Firestore (incluye rol)
      const userProfile = await this.firebaseSvc.getUserProfile(session.uid);

      const payload = {
        uid: session.uid,
        email: session.email,
        token: session.token,
        ...userProfile // agrega role, phone, photo, etc si existe en Firestore
      };

      await this.session.setSession(payload);

      alert('Inicio de sesión exitoso');
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (err: any) {
      alert('Error al iniciar sesión: ' + (err?.message || err));
    }
  }

  async loginWithGoogle() {
    try {
      const result = await this.firebaseSvc.loginWithGoogle();
      if (result.exists) {
        // Trae el doc Firestore con el role
        const userProfile = await this.firebaseSvc.getUserProfile(result.session.uid);
        const sessionPayload = {
          ...result.session,
          ...(userProfile ? {
            role: userProfile.role,
            phone: userProfile.phone,
            photo: userProfile.photo,
            email: userProfile.email,
            // agrega aquí cualquier otro campo de perfil que uses
          } : {})
        };
        await this.session.setSession(sessionPayload);
        alert('Inicio de sesión con Google exitoso');
        this.router.navigateByUrl('/home', { replaceUrl: true });
      } else {
        this.activarLoginForm();
        this.registerForm.patchValue({
          email: result.session.email,
          first_name: result.session.first_name,
          last_name: result.session.last_name,
          photo: result.session.photo
        });
        this.photoPreview = result.session.photo;
        alert('Completa tu registro antes de continuar.');
      }
    } catch (err: any) {
      alert('Error de autenticación con Google: ' + (err?.message || err));
    }
  }

  olvidasteEmail = "";

  async recoverPassword(email: string) {
    if (!email) {
      alert('Introduce tu correo electrónico.');
      return;
    }
    try {
      await this.firebaseSvc.sendPasswordReset(email);
      alert('Correo de recuperación enviado. Revisa tu email.');
      this.olvidasteEmail = "";
      this.activarLoginForm();
    } catch (err: any) {
      alert('Error al enviar reset: ' + (err?.message || err));
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
