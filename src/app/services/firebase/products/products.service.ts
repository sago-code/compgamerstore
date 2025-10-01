import { Injectable } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { Product, DesktopProduct, LaptopProduct } from 'src/app/models/product.model';
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
    // 🔹 Validación de campos base
    const baseRequiredFields: (keyof Product)[] = [
      'uid', 'product_name', 'description', 'price', 'type', 'product_image'
    ];
    for (const field of baseRequiredFields) {
      if (!product[field]) {
        throw new Error(`Falta el campo obligatorio: ${field}`);
      }
    }

    // 🔹 Validación específica para Desktop
    if (product.type === 'desktop') {
      const desktopFields: (keyof DesktopProduct)[] = [
        'brand_processor', 'reference_processor', 'ram', 'storage', 'graphics', 'motherboard', 'power_supply', 'case'
      ];
      for (const field of desktopFields) {
        if (!(product as any)[field]) {
          throw new Error(`Falta el campo obligatorio para Desktop: ${field}`);
        }
      }
    }

    // 🔹 Validación específica para Laptop
    if (product.type === 'laptop') {
      const laptopFields: (keyof LaptopProduct)[] = [
        'brand_processor', 'reference_processor', 'ram', 'storage', 'graphics', 'battery', 'weight'
      ];
      for (const field of laptopFields) {
        if (!(product as any)[field]) {
          throw new Error(`Falta el campo obligatorio para Laptop: ${field}`);
        }
      }
    }

    // 🔹 Timestamp y guardado
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

  async updateProduct(uid: string, product: Partial<Product>): Promise<void> {
    const now = serverTimestamp();
    const data = {
      ...product,
      updated_at: now
    };

    await setDoc(doc(this.db, 'products', uid), data, { merge: true });
  }
  
  async getProducts(): Promise<Product[]> {
    const productsRef = collection(this.db, 'products');
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map(doc => doc.data() as Product);
  }

  async getProductByUid(uid: string): Promise<Product | null> {
    const ref = doc(this.db, 'products', uid);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? (snapshot.data() as Product) : null;
  }

  async getProductByName(name: string): Promise<Product | null> {
    const productsRef = collection(this.db, 'products');
    const q = query(productsRef, where('product_name', '==', name));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : (snapshot.docs[0].data() as Product);
  }

  async softDeleteProduct(uid: string): Promise<void> {
    const now = serverTimestamp();
    await this.updateProduct(uid, { deleted_at: now });
  }

  async restoreProduct(uid: string): Promise<void> {
    await this.updateProduct(uid, { deleted_at: null });
  }

  async hardDeleteProduct(uid: string): Promise<void> {
    await deleteDoc(doc(this.db, 'products', uid));
  }
}
