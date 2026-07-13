'use client';

import { useState, useRef } from 'react';
import { extractTextFromImage, extractAmountFromText, detectCategoryFromText, extractStoreName, truncateText } from '@/app/lib/ocr';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    amount: number;
    categoryId: string;
    description: string;
    date: string;
  }) => void;
  categories: Category[];
};

export default function ScanReceiptModal({ isOpen, onClose, onConfirm, categories }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [amount, setAmount] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [storeName, setStoreName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Распознавание
    setIsScanning(true);
    setError(null);

    try {
      const text = await extractTextFromImage(file);
      setRecognizedText(text);
      
      // Извлекаем сумму
      const extractedAmount = extractAmountFromText(text);
      if (extractedAmount) {
        setAmount(extractedAmount);
      } else {
        setError('Не удалось найти сумму в чеке. Пожалуйста, введите вручную.');
      }
      
      // Определяем категорию
      const detectedCategory = detectCategoryFromText(text);
      if (detectedCategory) {
        const matchedCategory = categories.find(c => 
          c.name === detectedCategory && c.type === 'expense'
        );
        if (matchedCategory) {
          setCategoryId(matchedCategory.id);
        }
      }
      
      // Извлекаем название магазина
      const store = extractStoreName(text);
      if (store) {
        setStoreName(store);
        setDescription(store);
      }
      
      // Устанавливаем сегодняшнюю дату
      setDate(new Date().toISOString().split('T')[0]);
      
    } catch (error) {
      console.error('Scan error:', error);
      setError('Ошибка при распознавании чека. Попробуйте снова.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirm = () => {
    if (!amount) {
      setError('Пожалуйста, введите сумму');
      return;
    }
    
    if (!categoryId) {
      setError('Пожалуйста, выберите категорию');
      return;
    }

    onConfirm({
      amount,
      categoryId,
      description: description || storeName || 'Чек',
      date,
    });
    
    // Сброс
    setPreview(null);
    setRecognizedText('');
    setAmount(null);
    setCategoryId('');
    setDescription('');
    setStoreName(null);
    setError(null);
  };

  const handleClose = () => {
    setPreview(null);
    setRecognizedText('');
    setAmount(null);
    setCategoryId('');
    setDescription('');
    setStoreName(null);
    setError(null);
    setIsScanning(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl border border-white/10 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold gradient-text">📸 Сканировать чек</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Выбор файла */}
        {!preview && !isScanning && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="glass-light rounded-xl border-2 border-dashed border-white/20 p-8 text-center cursor-pointer hover:border-blue-500/50 transition"
          >
            <div className="text-4xl mb-3">📷</div>
            <p className="text-gray-400 text-sm">Нажмите, чтобы выбрать фото чека</p>
            <p className="text-gray-500 text-xs mt-1">Поддерживаются JPG, PNG</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Сканирование */}
        {isScanning && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-400 text-sm">Распознавание чека...</p>
            <p className="text-gray-500 text-xs mt-1">Это может занять несколько секунд</p>
          </div>
        )}

        {/* Превью */}
        {preview && !isScanning && (
          <div className="space-y-4">
            <div className="glass-light rounded-xl overflow-hidden">
              <img src={preview} alt="Чек" className="w-full object-contain max-h-48" />
            </div>

            {/* Распознанный текст (свёрнутый) */}
            {recognizedText && (
              <details className="glass-light rounded-xl p-3 border border-white/5">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-white transition">
                  📝 Распознанный текст
                </summary>
                <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap break-words">
                  {recognizedText}
                </p>
              </details>
            )}

            {/* Ошибка */}
            {error && (
              <div className="glass rounded-xl p-3 border border-red-500/30 bg-red-500/10">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Форма подтверждения */}
            <div className="space-y-3">
              {/* Сумма */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  💰 Сумма (₽)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || null)}
                  placeholder="Введите сумму"
                  className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>

              {/* Категория */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  📂 Категория
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition"
                  required
                >
                  <option value="" className="bg-[#0a0a0f]">Выберите категорию</option>
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  📝 Описание
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Название магазина или описание"
                  className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              {/* Дата */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  📅 Дата
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 glass rounded-xl py-2.5 text-sm text-gray-300 hover:text-white transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}