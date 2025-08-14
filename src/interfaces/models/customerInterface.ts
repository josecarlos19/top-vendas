import { BaseModelInterface } from "./baseModelInterface";

export interface CustomerModelInterface extends BaseModelInterface {
  name?: string;
  document?: string;
  document_type?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  active?: number;
}

export interface CustomerStoreInterface extends BaseModelInterface {
  name: string;
  document?: string;
  document_type?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
}

export interface CustomerUpdateInterface extends BaseModelInterface {
  id: number;
  name?: string;
  document?: string;
  document_type?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  active?: number;
}

export interface CustomerSearchInterface {
  q?: string;
  page?: number;
  perPage?: number;
}
