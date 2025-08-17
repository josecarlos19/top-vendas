  export interface StockMovementInterface {
    sale_id: number | null;
    product_id: number;
    type: 'stock_in' | 'sale' | 'return' | 'adjustment';
    quantity: number;
    unit_value: number;
    total_value: number;
    notes?: string;
  }
