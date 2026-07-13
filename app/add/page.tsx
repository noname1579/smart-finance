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

  // Функция загрузки категорий
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      console.log('📂 Ответ от API /categories:', res.status);
      
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
            {categories.length === 0 ? (
              <option value="" disabled className="bg-[#0a0a0f] text-gray-500">
                ⚠️ Нет категорий. Создайте их в разделе "Категории"
              </option>
            ) : (
              categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                  {cat.icon} {cat.name} ({cat.type === 'income' ? '📈 Доход' : '📉 Расход'})
                </option>
              ))
            )}
          </select>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-500">
              {categories.length} категорий
            </p>
            <button
              type="button"
              onClick={() => {
                router.push('/categories');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition"
            >
              + Управлять категориями
            </button>
          </div>
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