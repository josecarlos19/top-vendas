import { InstallmenteStatusUpdateInterface } from '@/interfaces/models/installmentInterface';
import { useSQLiteContext } from 'expo-sqlite';

export function useInstallmentDatabase() {
  const database = useSQLiteContext();

  async function updateStatus({
    id,
    status,
    payment_date,
  }: InstallmenteStatusUpdateInterface) {
    try {
      await database.withTransactionAsync(async () => {
        const updateStatement = await database.prepareAsync(
          'UPDATE installments SET status = ?, payment_date = ? WHERE id = ?'
        );
        await updateStatement.executeAsync(status!, payment_date!, id!);
        await updateStatement.finalizeAsync();

        const saleInfo = (await database.getFirstAsync(
          `
          SELECT
            s.id as sale_id,
            s.status as sale_status,
            COUNT(CASE WHEN i2.status = 'pending' THEN 1 END) as pending_count
          FROM installments i
          INNER JOIN sales s ON s.id = i.sale_id
          LEFT JOIN installments i2 ON i2.sale_id = s.id
          WHERE i.id = ?
          GROUP BY s.id, s.status`,
          [id]
        )) as {
          sale_id: number;
          sale_status: string;
          pending_count: number;
        } | null;

        if (!saleInfo) return;

        const newSaleStatus =
          saleInfo.pending_count === 0 && status === 'completed'
            ? 'completed'
            : saleInfo.pending_count > 0 && status === 'pending'
              ? 'pending'
              : null;

        if (newSaleStatus && newSaleStatus !== saleInfo.sale_status) {
          const updateSaleStatement = await database.prepareAsync(
            'UPDATE sales SET status = ? WHERE id = ?'
          );
          await updateSaleStatement.executeAsync(
            newSaleStatus,
            saleInfo.sale_id
          );
          await updateSaleStatement.finalizeAsync();
        }
      });
    } catch (error) {
      console.error('Error updating installment status:', error);
      throw new Error('Failed to update installment status');
    }
  }

  return {
    updateStatus,
  };
}
