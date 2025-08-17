export default function formatCurrency(text: string): string {
  const numbers = text.replace(/\D/g, '');
  if (numbers === '') return '';
  const value = parseInt(numbers) / 100;

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
