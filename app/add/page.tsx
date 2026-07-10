'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFromStorage, setToStorage } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

type Transaction = {
  id: string;
  amount: number;
  categoryId: string;
  description?: string;
  date: string;
  createdAt: string;
};

// Дефолтные категории
const defaultCategories: Category[] = [
  { id: 'food', name: 'Еда', icon: '🍔', color: '#FF6384', type: 'expense' },
  { id: 'transport', name: 'Транспорт', icon: '🚗', color: '#36A2EB', type: 'expense' },
  { id: 'housing', name: 'Жильё', icon: '🏠', color: '#FFCE56', type: 'expense' },
  { id: 'entertainment', name: 'Развлечения', icon: '🎮', color: '#4BC0C0', type: 'expense' },
  { id: 'salary', name: 'Зарплата', icon: '💰', color: '#FF9F40', type: 'income' },
  { id: 'other', name: 'Прочее', icon: '📦', color: '#9966FF', type: 'expense' },
];

// Популярные иконки
const POPULAR_ICONS = ['🍔', '🚗', '🏠', '🎮', '💰', '📦', '🛒', '☕', '🍕', '🎬', '✈️', '🏥', '📚', '🎵', '👕', '💄', '🔧', '🎁', '🏋️', '🧘'];

export default function AddPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(true);
  
  // Основная форма
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  // Состояние для модалки создания категории
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [newCategoryColor, setNewCategoryColor] = useState('#36A2EB');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');

  // Загрузка данных
  useEffect(() => {
    const savedTxs = getFromStorage<Transaction[]>('transactions', []);
    const savedCats = getFromStorage<Category[]>('categories', defaultCategories);
    setTransactions(savedTxs);
    setCategories(savedCats);
    setIsLoading(false);
    setDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Создание новой категории
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Введите название категории');
      return;
    }

    // Проверяем, нет ли уже такой категории
    const exists = categories.some(c => 
      c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (exists) {
      alert('Категория с таким названием уже существует');
      return;
    }

    const newCat: Category = {
      id: uuidv4(),
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      type: newCategoryType,
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    setToStorage('categories', updated);
    
    // Автоматически выбираем новую категорию
    setCategoryId(newCat.id);
    
    // Закрываем модалку и сбрасываем форму
    setIsModalOpen(false);
    setNewCategoryName('');
    setNewCategoryIcon('📌');
    setNewCategoryColor('#36A2EB');
    setNewCategoryType('expense');
    
    // Показываем уведомление
    alert(`✅ Категория "${newCat.name}" создана и выбрана!`);
  };

  // Отправка транзакции
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      setError('⚠️ Пожалуйста, введите сумму');
      return;
    }
    
    if (numAmount <= 0) {
      setError('⚠️ Сумма должна быть больше 0');
      return;
    }
    
    if (!categoryId) {
      setError('⚠️ Пожалуйста, выберите категорию');
      return;
    }

    const newTx: Transaction = {
      id: uuidv4(),
      amount: numAmount,
      categoryId: categoryId,
      description: description || '',
      date: date,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...transactions, newTx];
    setTransactions(updated);
    setToStorage('transactions', updated);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Загрузка...</p>
      </div>
    );
  }

  // Разделяем категории на доходы и расходы
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <button 
          onClick={() => router.back()}
          className="glass rounded-full p-2 hover:bg-white/5 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold gradient-text">
          Добавить трату
        </h1>
      </div>
      
      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Сумма */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            💰 Сумма (₽)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            placeholder="1000"
            className={`glass w-full rounded-xl border p-3.5 text-white text-base placeholder:text-gray-500 focus:outline-none transition ${
              error && !amount ? 'border-red-500/50' : 'border-white/10 focus:border-blue-500/50'
            }`}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Минимальная сумма: 0.01 ₽</p>
        </div>

        {/* Категория с кнопкой "Создать" */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            📂 Категория
          </label>
          <div className="flex gap-2">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setError('');
              }}
              className="flex-1 glass rounded-xl border border-white/10 p-3.5 text-white text-base bg-transparent focus:outline-none focus:border-blue-500/50 transition appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-[#0a0a0f]">Выберите категорию</option>
              
              {expenseCategories.length > 0 && (
                <optgroup label="📉 Расходы" className="bg-[#0a0a0f]">
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </optgroup>
              )}
              
              {incomeCategories.length > 0 && (
                <optgroup label="📈 Доходы" className="bg-[#0a0a0f]">
                  {incomeCategories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="glass rounded-xl px-4 border border-white/10 hover:border-blue-500/50 transition text-white hover:text-blue-400"
              title="Создать новую категорию"
            >
              <span className="text-xl leading-none">+</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {categories.length} категорий • Нажмите <span className="text-blue-400">+</span> для создания новой
          </p>
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
            placeholder="Обед в кафе"
            className="glass w-full rounded-xl border border-white/10 p-3.5 text-white text-base placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
          />
          <p className="text-xs text-gray-500 mt-1">Необязательное поле</p>
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
            className="glass w-full rounded-xl border border-white/10 p-3.5 text-white text-base bg-transparent focus:outline-none focus:border-blue-500/50 transition"
            required
          />
        </div>

        {/* Кнопка отправки */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 px-4 rounded-xl font-semibold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          ✅ Добавить транзакцию
        </button>
      </form>

      {/* Модальное окно создания категории */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Оверлей */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Модалка */}
          <div className="relative glass rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* Заголовок */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold gradient-text">✨ Новая категория</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Название */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Название
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Например: Кафе, Такси, Зарплата"
                  className="glass w-full rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                  autoFocus
                />
              </div>

              {/* Иконка и цвет */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Иконка
                  </label>
                  <input
                    type="text"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    placeholder="🍔"
                    className="glass w-full rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Цвет
                  </label>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Тип */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Тип
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('expense')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      newCategoryType === 'expense'
                        ? 'glass border border-red-500/50 text-red-400'
                        : 'glass-light text-gray-400 hover:text-white'
                    }`}
                  >
                    📉 Расход
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('income')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      newCategoryType === 'income'
                        ? 'glass border border-green-500/50 text-green-400'
                        : 'glass-light text-gray-400 hover:text-white'
                    }`}
                  >
                    📈 Доход
                  </button>
                </div>
              </div>

              {/* Быстрый выбор иконок */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Популярные иконки
                </label>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCategoryIcon(icon)}
                      className={`p-1.5 rounded-lg transition hover:bg-white/10 ${
                        newCategoryIcon === icon ? 'glass border border-blue-500/50' : ''
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 glass rounded-xl py-3 text-gray-300 hover:text-white transition"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  ✨ Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}