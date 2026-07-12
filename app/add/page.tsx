'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/ToastProvider';

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

  // Загрузка категорий
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session) {
      fetchCategories();
    }
  }, [session, status]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Ошибка загрузки категорий');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('❌ Ошибка загрузки категорий', 'error');
    } finally {
      setIsLoading(false);
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

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
      
      // Очищаем форму
      setAmount('');
      setCategoryId('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      
      // Переход на главную с обновлением
      router.push('/');
    } catch (error) {
      console.error('Transaction creation error:', error);
      setError(error instanceof Error ? error.message : '⚠️ Ошибка создания транзакции');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#0a0a0f]">
        <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3 pt-4">
        <button 
          onClick={() => router.push('/')}
          className="glass rounded-full p-2 hover:bg-white/5 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold gradient-text">
          ➕ Добавить трату
        </h1>
      </div>
      
      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            📂 Категория
          </label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setError('');
            }}
            className="glass w-full rounded-xl border border-white/10 p-3.5 text-white text-base bg-transparent focus:outline-none focus:border-blue-500/50 transition appearance-none cursor-pointer"
            required
          >
            <option value="" className="bg-[#0a0a0f]">Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                {cat.icon} {cat.name} ({cat.type === 'income' ? '📈 Доход' : '📉 Расход'})
              </option>
            ))}
          </select>
        </div>

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

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 px-4 rounded-xl font-semibold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          ✅ Добавить транзакцию
        </button>
      </form>
    </div>
  );
}