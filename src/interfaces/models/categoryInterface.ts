import { BaseModelInterface } from "./baseModelInterface";

export interface CategoryModelInterface extends BaseModelInterface {
  name?: string;
  description?: string;
  active?: number;
}

export interface CategoryStoreInterface extends BaseModelInterface {
  name: string;
  description?: string;
}

export interface CategoryUpdateInterface extends BaseModelInterface {
  id: number;
  name?: string;
  description?: string;
  active?: number;
}

export interface CategorySearchInterface {
  name?: string;
  description?: string;
  active?: number;
  page?: number;
  perPage?: number;
}
