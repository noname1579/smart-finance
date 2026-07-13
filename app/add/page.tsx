'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/ToastProvider';
import LoadingScreen from '@/app/components/LoadingScreen';
import BackHomeButton from '@/app/components/BackHomeButton';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

export default function AddPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [isExpense, setIsExpense] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      
      if (!res.ok) throw new Error('Ошибка загрузки категорий');
      
      const data = await res.json();
      console.log('📂 Загружено категорий:', data.length);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('❌ Ошибка загрузки категорий', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session) {
      fetchCategories();
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [session, status, router, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      setError('⚠️ Введите сумму');
      return;
    }
    
    if (numAmount <= 0) {
      setError('⚠️ Сумма должна быть больше 0');
      return;
    }
    
    if (!categoryId) {
      setError('⚠️ Выберите категорию');
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          categoryId,
          description: description || '',
          date: date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания транзакции');
      }

      showToast('✅ Транзакция успешно добавлена!', 'success');
      
      setAmount('');
      setCategoryId('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      
      router.push('/');
    } catch (error) {
      console.error('Transaction creation error:', error);
      setError(error instanceof Error ? error.message : '⚠️ Ошибка создания транзакции');
    }
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  const handleTypeSwitch = (type: 'expense' | 'income') => {
    setIsExpense(type === 'expense');
    const cats = type === 'expense' ? expenseCategories : incomeCategories;
    if (cats.length > 0) {
      setCategoryId(cats[0].id);
    } else {
      setCategoryId('');
    }
  };

  if (status === 'loading' || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold gradient-text">➕ Добавить трату</h1>
        <BackHomeButton />
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
            className="glass w-full rounded-xl border border-white/10 p-3.5 text-white text-base placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Минимальная сумма: 0.01 ₽</p>
        </div>

        {/* Переключатель типа — понятные цвета */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            📊 Тип транзакции
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isExpense
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20 scale-[1.02]'
                  : 'glass-light text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <span>📉</span> Расход
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                !isExpense
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/20 scale-[1.02]'
                  : 'glass-light text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <span>📈</span> Доход
              </span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isExpense ? '🔴 Выбран режим "Расход"' : '🟢 Выбран режим "Доход"'}
          </p>
        </div>

        {/* Категория */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            📂 Категория {isExpense ? '(расход)' : '(доход)'}
          </label>
          
          {categories.length === 0 ? (
            <div className="glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/10 text-center">
              <p className="text-yellow-400 text-sm">⚠️ Нет категорий</p>
              <button
                type="button"
                onClick={() => router.push('/categories')}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
              >
                + Создать категорию
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {(isExpense ? expenseCategories : incomeCategories).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    setError('');
                  }}
                  className={`glass rounded-xl p-2.5 transition-all duration-200 ${
                    categoryId === cat.id
                      ? 'border border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20 scale-[1.02]'
                      : 'border border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">{cat.name}</span>
                    {categoryId === cat.id && (
                      <div className="w-3 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div className="flex justify-between mt-2">
            <button
              type="button"
              onClick={() => {
                router.push('/categories');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition"
            >
              Управлять категориями
            </button>
          </div>
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

        {/* Кнопка отправки — цвет зависит от типа */}
        <button
          type="submit"
          className={`w-full py-3.5 px-4 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
            isExpense
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/20 hover:shadow-red-500/30'
              : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-500/20 hover:shadow-green-500/30'
          }`}
        >
          {isExpense ? 'Добавить расход' : 'Добавить доход'}
        </button>
      </form>
    </div>
  );
}