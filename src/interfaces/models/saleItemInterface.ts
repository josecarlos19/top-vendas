import { BaseModelInterface } from './baseModelInterface';
export interface SaleItemModelInterface extends BaseModelInterface {
  sale_id?: number;
  product_id?: number;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;
}

export interface SaleItemStoreInterface extends BaseModelInterface {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleItemUpdateInterface extends BaseModelInterface {
  id: number;
  sale_id?: number;
  product_id?: number;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;
}
