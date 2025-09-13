import { BaseModelInterface } from './baseModelInterface';
import { SaleItemStoreInterface } from './saleItemInterface';

export interface SaleModelInterface extends BaseModelInterface {
  customer_id?: number;
  subtotal?: number;
  discount?: number;
  total?: number;
  payment_method?:
    | 'cash'
    | 'credit_card'
    | 'debit_card'
    | 'pix'
    | 'bank_transfer';
  installments?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  sale_date?: Date;
  notes?: string;
  deleted_at?: Date;
}

export interface SaleStoreInterface extends BaseModelInterface {
  customer_id: number;
  subtotal: number;
  discount?: number;
  total: number;
  payment_method:
    | 'cash'
    | 'credit_card'
    | 'debit_card'
    | 'pix'
    | 'bank_transfer';
  installments: number;
  status?: 'pending' | 'completed' | 'cancelled';
  sale_date?: Date;
  notes?: string;
  itens: SaleItemStoreInterface[];
  first_due_date: Date;
}

export interface SaleUpdateInterface extends BaseModelInterface {
  id: number;
  status?: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  first_due_date?: Date;
}

export interface SaleSearchInterface {
  q?: string;
  page?: number;
  perPage?: number;
}
