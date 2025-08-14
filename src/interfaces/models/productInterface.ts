import { BaseModelInterface } from "./baseModelInterface";

export interface ProductModelInterface extends BaseModelInterface {
  name?: string;
  barcode?: string;
  reference?: string;
  description?: string;
  cost_price?: number;
  sale_price?: number;
  wholesale_price?: number;
  current_stock?: number;
  minimum_stock?: number;
  category_id?: number;
  supplier?: string;
  active?: number;
}

export interface ProductStoreInterface extends BaseModelInterface {
  name: string;
  barcode?: string;
  reference?: string;
  description?: string;
  cost_price?: number;
  sale_price: number;
  wholesale_price?: number;
  current_stock?: number;
  minimum_stock?: number;
  category_id?: number;
  supplier?: string;
}

export interface ProductUpdateInterface extends BaseModelInterface {
  id: number;
  name?: string;
  barcode?: string;
  reference?: string;
  description?: string;
  cost_price?: number;
  sale_price?: number;
  wholesale_price?: number;
  current_stock?: number;
  minimum_stock?: number;
  category_id?: number;
  supplier?: string;
  active?: number;
}

export interface ProductSearchInterface {
  q?: string;
  category_id?: number;
  active?: number;
  low_stock?: boolean;
  page?: number;
  perPage?: number;
}
