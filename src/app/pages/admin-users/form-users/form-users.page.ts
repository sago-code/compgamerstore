import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import imageCompression from 'browser-image-compression';
import { User } from 'src/app/models/user.model';
import { UserFirebaseService } from 'src/app/services/firebase/users/users.service';

@Component({
  selector: 'app-form-users',
  templateUrl: './form-users.page.html',
  styleUrls: ['./form-users.page.scss'],
  standalone: false
})
export class FormUsersPage implements OnInit {
  photoPreview: string | null = null;
  mode: 'create' | 'edit' = 'create';
  user: User

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
    
  pageTitle = 'Crear usuario';
  constructor(
    private alertCtrl: AlertController,
    private userService: UserFirebaseService
  ) { }

  ngOnInit() {
  }

  

  async saveUser() {
    try {
      if(this.mode === 'create') {
        await this.userService.createUser(this.registerForm.value);
      } else {
        // Lógica para actualizar usuario
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
