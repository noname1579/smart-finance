/**
 * Форматирует сумму денег
 * - Если есть копейки (не 00) — показывает с копейками
 * - Если копейки 00 — показывает без копеек
 * 
 * @param amount - сумма (число)
 * @returns отформатированная строка
 */
export function formatMoney(amount: number): string {
  // Округляем до 2 знаков для точности
  const rounded = Math.round(amount * 100) / 100;
  
  // Проверяем, есть ли копейки
  const hasCents = Math.round((rounded % 1) * 100) !== 0;
  
  if (hasCents) {
    // С копейками: 1234.56 → 1 234.56 ₽
    return rounded.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  } else {
    // Без копеек: 1234.00 → 1 234 ₽
    return Math.round(rounded).toLocaleString('ru-RU') + ' ₽';
  }
}

/**
 * Форматирует сумму с знаком (+ или -)
 */
export function formatMoneyWithSign(amount: number, isNegative: boolean): string {
  const formatted = formatMoney(Math.abs(amount));
  return isNegative ? `-${formatted}` : `+${formatted}`;
}