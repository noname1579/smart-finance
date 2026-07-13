import { createWorker } from 'tesseract.js';

/**
 * Распознаёт текст с изображения
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const worker = await createWorker('rus');
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Не удалось распознать текст на изображении');
  }
}

/**
 * Извлекает сумму из текста чека
 */
export function extractAmountFromText(text: string): number | null {
  // Очищаем текст от лишних пробелов
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Варианты поиска суммы в чеке
  const patterns = [
    /ИТОГО\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /ИТОГ\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /СУММА\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /К ОПЛАТЕ\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /ВСЕГО\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /TOTAL\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /ОПЛАТА\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /Стоимость\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /К оплате\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
    /Итого к оплате\s*[:.\s]*([\d,]+\.?[\d]{0,2})/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Преобразуем строку в число (заменяем запятую на точку)
      const amountStr = match[1].replace(/,/g, '.');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  
  // Если не нашли по ключевым словам, ищем все числа в тексте
  const allNumbers = text.match(/\b(\d+[.,]\d{2})\b/g);
  if (allNumbers) {
    // Берём самое большое число (обычно это итоговая сумма)
    const numbers = allNumbers
      .map(n => parseFloat(n.replace(/,/g, '.')))
      .filter(n => !isNaN(n) && n > 0)
      .sort((a, b) => b - a);
    
    if (numbers.length > 0) {
      // Возвращаем самое большое число, но не больше 1 миллиона (защита от ошибок)
      const maxNumber = numbers[0];
      if (maxNumber < 1000000) {
        return maxNumber;
      }
    }
  }
  
  return null;
}

/**
 * Определяет категорию по названиям товаров в чеке
 */
export function detectCategoryFromText(text: string): string | null {
  const keywords: Record<string, string[]> = {
    'Еда': [
      'хлеб', 'молоко', 'сыр', 'мясо', 'рыба', 'овощи', 'фрукты',
      'продукты', 'магазин', 'супермаркет', 'пятерочка', 'магнит',
      'перекрёсток', 'ашан', 'дикси', 'продукт', 'еда', 'обед', 'ужин',
      'завтрак', 'ресторан', 'кафе', 'столовая', 'курица', 'говядина',
      'свинина', 'макароны', 'рис', 'гречка', 'хлопья', 'йогурт', 'сок'
    ],
    'Транспорт': [
      'такси', 'яндекс', 'uber', 'метро', 'автобус', 'троллейбус',
      'трамвай', 'электричка', 'бензин', 'газ', 'заправка', 'лукойл',
      'газпром', 'rosneft', 'парковка', 'штраф', 'транспорт', 'проезд',
      'аэроэкспресс', 'поезд', 'самолёт', 'билет'
    ],
    'Жильё': [
      'аренда', 'квартплата', 'жкх', 'коммунал', 'электричество',
      'отопление', 'вода', 'газ', 'свет', 'ремонт', 'сантехник',
      'электрик', 'коммунальные', 'квартира', 'дом', 'дача'
    ],
    'Развлечения': [
      'кино', 'театр', 'концерт', 'ресторан', 'бар', 'ночной клуб',
      'квест', 'боулинг', 'караоке', 'игры', 'playstation', 'xbox',
      'steam', 'подписка', 'netflix', 'spotify', 'ютуб', 'дискотека'
    ],
    'Зарплата': [], // Доходы — не определяем автоматически
    'Прочее': [] // По умолчанию
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [category, words] of Object.entries(keywords)) {
    if (category === 'Зарплата' || category === 'Прочее') continue;
    
    for (const word of words) {
      if (lowerText.includes(word)) {
        return category;
      }
    }
  }
  
  // Если есть "ЗАРПЛАТА" или "ПЕРЕВОД" в тексте — это доход
  if (lowerText.includes('зарплата') || lowerText.includes('перевод')) {
    return 'Зарплата';
  }
  
  return 'Прочее';
}

/**
 * Извлекает название магазина из текста чека
 */
export function extractStoreName(text: string): string | null {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Часто название магазина в первой строке
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Убираем возможные даты и время из первой строки
    const cleanName = firstLine.replace(/^\d{2}\.\d{2}\.\d{4}/, '').trim();
    if (cleanName.length > 2 && cleanName.length < 50) {
      return cleanName;
    }
  }
  
  return null;
}

/**
 * Сокращает длинный текст
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}