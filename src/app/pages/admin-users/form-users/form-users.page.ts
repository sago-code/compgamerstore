import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import imageCompression from 'browser-image-compression';
import { User } from 'src/app/models/user.model';
import { UserFirebaseService } from 'src/app/services/firebase/users/users.service';
import { AdminUsersStateService } from 'src/app/services/state/admin-users-state.service';

@Component({
  selector: 'app-form-users',
  templateUrl: './form-users.page.html',
  styleUrls: ['./form-users.page.scss'],
  standalone: false
})
export class FormUsersPage implements OnInit {
  photoPreview: string | null = null;
  mode: 'create' | 'edit' = 'create';
  
  // Inicializar el objeto user con valores por defecto
  user: User = {
    uid: '',
    photo: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    age: 0,
    document_type: '',
    document_number: '',
    departament: '',
    municipality: '',
    direction: '',
    role: 'admin',
    phone: 0
  };

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

  fruitSelectionChanged(departamentCode: string) {
    this.valueMunicipality = this.valueMunicipalityTotal.filter(municipality =>
      municipality.codDepartament === departamentCode
    );
  }
  
  pageTitle = 'Crear usuario';
  constructor(
    private alertCtrl: AlertController,
    private userService: UserFirebaseService,
    private route: ActivatedRoute,
    private router: Router,
    private adminUsersState: AdminUsersStateService
  ) { }

  ngOnInit() {
    this.adminUsersState.getMode().subscribe(mode => {
      this.mode = mode;
      this.pageTitle = this.mode === 'create' ? 'Crear usuario' : 'Editar usuario';
      this.setupValidatorsForMode();
    });

    this.adminUsersState.getEditingUserId().subscribe(uid => {
      if (this.mode === 'edit' && uid) {
        this.loadUserDataById(uid);
      }
    });
  }

  private setupValidatorsForMode() {
    const passwordCtrl = this.registerForm.get('password');
    const confirmCtrl = this.registerForm.get('confirm_password');

    if (this.mode === 'create') {
      passwordCtrl?.setValidators([Validators.required]);
      confirmCtrl?.setValidators([Validators.required]);
      this.registerForm.setValidators(this.passwordsMatchValidator.bind(this));
    } else {
      passwordCtrl?.clearValidators();
      confirmCtrl?.clearValidators();
      this.registerForm.clearValidators();
    }

    passwordCtrl?.updateValueAndValidity({ emitEvent: false });
    confirmCtrl?.updateValueAndValidity({ emitEvent: false });
    this.registerForm.updateValueAndValidity({ emitEvent: false });
  }

  private async loadUserDataById(uid: string) {
    try {
      const user = await this.userService.getUserProfile(uid);
      if (!user) return;

      this.user = user;
      this.photoPreview = user.photo || null;

      if (user.departament) {
        this.fruitSelectionChanged(user.departament);
      }

      this.registerForm.patchValue({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone != null ? String(user.phone) : '',
        document_type: user.document_type || '',
        document_number: user.document_number || '',
        age: user.age != null ? String(user.age) : '',
        departament: user.departament || '',
        municipality: user.municipality || '',
        address: user.direction || '',
        role: user.role || 'admin',
        photo: this.photoPreview
      });
    } catch (err) {
      console.error('Error cargando usuario:', err);
    }
  }

  private passwordsMatchValidator(form: FormGroup) {
    const pass = form.get('password')?.value;
    const confirm = form.get('confirm_password')?.value;
    if (this.mode !== 'create') return null;
    return pass === confirm ? null : { passwordsMismatch: true };
  }

  loadUserData(params: any) {
    // Cargar datos del usuario desde los parámetros
    this.user = {
      uid: params['userId'] || '',
      photo: '',
      first_name: params['first_name'] || '',
      last_name: params['last_name'] || '',
      email: params['email'] || '',
      password: '',
      age: 0,
      document_type: '',
      document_number: '',
      departament: '',
      municipality: '',
      direction: '',
      role: params['role'] || 'admin',
      phone: params['phone'] || 0
    };
  }
  
  async saveUser() {

    if (this.registerForm.invalid) {
      alert('Por favor completa todos los campos correctamente.');
      return;
    }

    const form = this.registerForm.value as any;
    try {

      if (this.mode === 'create') {
        const userData: User = {
          uid: this.user.uid,
          photo: this.user.photo || '',
          first_name: form.first_name || '',
          last_name: form.last_name || '',
          email: form.email || '',
          password: form.password || '',
          phone: form.phone ? Number(form.phone) : 0,
          role: form.role || 'admin',
          age: form.age ? Number(form.age) : 0,
          document_type: form.document_type || '',
          document_number: form.document_number || '',
          departament: form.departament || '',
          municipality: form.municipality || '',
          direction: form.address || ''
        };

        await this.userService.registerUser(userData);
        await this.showAlert('Éxito', 'Usuario creado correctamente');
        this.router.navigate(['/admin-users']);
      } else {
        const updatedUser: User = {
          uid: this.user.uid,
          photo: this.user.photo || '',
          first_name: form.first_name || this.user.first_name,
          last_name: form.last_name || this.user.last_name,
          email: form.email || this.user.email,
          password: '', // no se actualiza en edición
          phone: form.phone ? Number(form.phone) : (this.user.phone || 0),
          role: form.role || this.user.role || 'admin',
          age: form.age ? Number(form.age) : (this.user.age || 0),
          document_type: form.document_type || this.user.document_type || '',
          document_number: form.document_number || this.user.document_number || '',
          departament: form.departament || this.user.departament || '',
          municipality: form.municipality || this.user.municipality || '',
          direction: form.address || this.user.direction || ''
        };

        await this.userService.updateUser(updatedUser.uid, updatedUser);
        await this.showAlert('Éxito', 'Usuario actualizado correctamente');
        this.router.navigate(['/admin-users']);
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      await this.showAlert('Error', 'No se pudo crear el usuario.');
    }
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Selecciona solo archivos de imagen.');
      return;
    }

    try {
      // Opciones de compresión
      const options = {
        maxSizeMB: 1,           // tamaño máximo en MB
        maxWidthOrHeight: 800,  // ancho o alto máximo
        useWebWorker: true
      };

      // Comprimir la imagen
      const compressedFile = await imageCompression(file, options);

      // Convertir a Base64
      const base64 = await this.fileToBase64(compressedFile);

      this.photoPreview = base64;
      this.user.photo = base64;

    } catch (error) {
      console.error('Error comprimiendo la imagen:', error);
      await this.showAlert('Error', 'No se pudo procesar la imagen.');
    }
  }

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
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

