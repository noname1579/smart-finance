'use client';

import { useState, useEffect } from 'react';

type Transaction = {
  id: string;
  amount: number;
  categoryId: string;
  description?: string;
  date: string;
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

type Props = {
  isOpen: boolean;
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onSave: (updated: Transaction) => void;
};

export default function EditModal({ isOpen, transaction, categories, onClose, onSave }: Props) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  // Заполняем форму при открытии
  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.categoryId);
      setDescription(transaction.description || '');
      setDate(transaction.date);
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;
    if (!amount || !categoryId) {
      alert('Пожалуйста, заполните сумму и категорию');
      return;
    }

    const updated: Transaction = {
      ...transaction,
      amount: parseFloat(amount),
      categoryId: categoryId,
      description: description || '',
      date: date,
    };

    onSave(updated);
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Оверлей */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="relative glass rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold gradient-text">✏️ Редактировать</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Сумма */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              💰 Сумма (₽)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass w-full rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
              required
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              📂 Категория
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="glass w-full rounded-xl border border-white/10 p-3 text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition appearance-none cursor-pointer"
              required
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                  {cat.icon} {cat.name} {cat.type === 'income' ? '📈' : '📉'}
                </option>
              ))}
            </select>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              📝 Описание
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание"
              className="glass w-full rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
            />
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              📅 Дата
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass w-full rounded-xl border border-white/10 p-3 text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition"
              required
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass rounded-xl py-3 text-gray-300 hover:text-white transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              💾 Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}