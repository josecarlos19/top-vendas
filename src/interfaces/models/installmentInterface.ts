export interface InstallmentItemInterface {
  id: number;
  sale_id: number;
  number: number;
  amount: number;
  due_date: string;
  payment_date?: string
  paid_amount?: number
  status: string | 'pending'
  notes?: string
}
