import { Injectable } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { Product, DesktopProduct } from 'src/app/models/product.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private app: FirebaseApp;
  private db: Firestore;

  constructor() {
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
  }

  /**
   * Crea un producto de cualquier tipo (Desktop, Monitor, etc.) en Firestore.
   * Valida los campos mínimos y los obligatorios según el tipo.
   * @param product Producto a guardar; debe tener el campo `type` acorde a su subtipo.
   */
  async createProduct(product: Product): Promise<void> {
    // Validación básica según el tipo
    if (!product.type) {
      throw new Error('El producto debe tener el campo "type"');
    }

    if (product.type === 'desktop') {
      const DesktopProductRequiredFields: (keyof DesktopProduct)[] = [
        'processor', 'ram', 'storage', 'graphics', 'motherboard', 'power_supply', 'case'
      ];
      for (const field of DesktopProductRequiredFields) {
        if (!(product as any)[field]) {
          throw new Error(`Falta el campo obligatorio de DesktopProduct: ${field}`);
        }
      }
    }
    // ...puedes agregar más validaciones para otros subtipos si lo necesitas

    const now = serverTimestamp();
    const data = {
      ...product,
      created_at: now,
      updated_at: now,
      deleted_at: null
    };

    try {
      await setDoc(doc(this.db, 'products', product.uid), data);
    } catch (error) {
      throw error;
    }
  }

  
  async getProducts(): Promise<Product[]> {
    const productsRef = collection(this.db, 'products');
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map(doc => doc.data() as Product);
  }
}
