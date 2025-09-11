import { FieldValue } from "firebase/firestore";

export interface Product {
  uid: string;
  product_image: string;
  product_name: string;
  description: string;
  price: number;
  stock: number;
  type: string; // <-- ¡Ahora es obligatorio en Product!
  created_at: FieldValue;
  updated_at: FieldValue;
  deleted_at: FieldValue | null;
}

export interface DesktopProduct extends Product {
  type: "desktop";
  brand_processor: string;
  reference_processor: string;
  ram: string;
  storage: string;
  graphics: string;
  motherboard: string;
  power_supply: string;
  case: string;
}

export interface LaptopProduct extends Product {
  type: "laptop"; // Identificador del tipo
  brand_processor: string;
  reference_processor: string;
  ram: string;
  storage: string;
  graphics: string;
  battery: string;
  weight: string;
}

export interface HardwareProduct extends Product {
  type: "hardware"; // Identificador del tipo
  category: string;
  subcategory: string;
  brand: string;
  model: string;
  color: string;
  dimensions: string;
}