import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ProductsService } from 'src/app/services/firebase/products/products.service';
import { DesktopProduct, HardwareProduct, LaptopProduct, Product } from 'src/app/models/product.model';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-formproduct',
  templateUrl: './formproduct.page.html',
  styleUrls: ['./formproduct.page.scss'],
  standalone: false
})
export class FormproductPage implements OnInit {
  pageTitle = 'Crear producto';
  product!: Product;
  photoPreview: string | null = null;
  mode: 'create' | 'edit' = 'create';
  originalUid: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private productsService: ProductsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      const mode = params['mode'];
      const uid = params['uid'];
      const type = params['type'];

      if (mode === 'edit' && uid) {
        this.pageTitle = 'Editar producto';
        this.mode = 'edit';
        this.originalUid = uid;

        try {
          const product = await this.productsService.getProductByUid(uid);
          if (product) {
            this.product = product;
            this.photoPreview = product.product_image || null;
          }
        } catch (err) {
          console.error('Error cargando producto:', err);
        }
      } else {
        this.pageTitle = 'Crear producto';
        this.mode = 'create';
        this.product = {
          uid: crypto.randomUUID(),
          product_name: '',
          product_image: '',
          description: '',
          price: 0,
          stock: 0,
          type: type || '',
          created_at: null as any,
          updated_at: null as any,
          deleted_at: null
        };
      }
    });
  }

  // Type guards
  isDesktop(p: Product): p is DesktopProduct {
    return p.type === 'desktop';
  }

  isLaptop(p: Product): p is LaptopProduct {
    return p.type === 'laptop';
  }

  isHardware(p: Product): p is HardwareProduct {
    return p.type === 'hardware';
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
      this.product.product_image = base64;

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

  async saveProduct() {
    try {
      if (this.mode === 'edit' && this.originalUid) {
        await this.productsService.updateProduct(this.originalUid, this.product);
        await this.showAlert('¡Éxito!', 'Producto actualizado correctamente.');
      } else {
        await this.productsService.createProduct(this.product);
        await this.showAlert('¡Éxito!', 'Producto guardado correctamente.');
      }

      this.router.navigate(['/products'], { queryParams: { type: this.product.type } });
    } catch (error: any) {
      await this.showAlert('Error', error.message || 'Ocurrió un error al guardar el producto.');
    }
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

