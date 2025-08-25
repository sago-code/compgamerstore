import { FieldValue } from "firebase/firestore";

export interface Product {
  uid: string;
  product_name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  type: string; // <-- ¡Ahora es obligatorio en Product!
  created_at: FieldValue;
  updated_at: FieldValue;
  deleted_at: FieldValue | null;
}

export interface DesktopProduct extends Product {
  type: "desktop"; // Identificador del tipo
  processor: string;
  ram: string;
  storage: string;
  graphics: string;
  motherboard: string;
  power_supply: string;
  case: string;
}
