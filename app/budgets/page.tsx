'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoadingScreen from '../components/LoadingScreen';
import BackHomeButton from '../components/BackHomeButton';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

type Budget = {
  id: string;
  categoryId: string;
  category: Category;
  limitAmount: number;
  spentAmount: number;
  period: 'monthly' | 'weekly';
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export default function BudgetsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [completedBudgets, setCompletedBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'monthly' | 'weekly'>('all');

  const fetchData = useCallback(async () => {
    try {
      const [budgetsRes, catsRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories'),
      ]);

      if (!budgetsRes.ok || !catsRes.ok) {
        throw new Error('Ошибка загрузки данных');
      }

      const budgetsData = await budgetsRes.json();
      const catsData = await catsRes.json();

      setCategories(catsData);

      const active = budgetsData.filter((b: Budget) => b.isActive);
      const completed = budgetsData.filter((b: Budget) => !b.isActive);

      setBudgets(active);
      setCompletedBudgets(completed);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session) {
      fetchData();
    }
  }, [session, status, router, fetchData]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!categoryId) {
      setError('Выберите категорию');
      return;
    }

    const amount = parseFloat(limitAmount);
    if (!limitAmount || isNaN(amount) || amount <= 0) {
      setError('Введите корректную сумму лимита');
      return;
    }

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          limitAmount: amount,
          period,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка создания бюджета');
        return;
      }

      setBudgets([data, ...budgets]);
      setSuccess('✅ Бюджет создан!');
      setCategoryId('');
      setLimitAmount('');
      setPeriod('monthly');

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Произошла ошибка');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Удалить бюджет?')) return;

    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');

      setBudgets(budgets.filter(b => b.id !== id));
      setCompletedBudgets(completedBudgets.filter(b => b.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Ошибка удаления бюджета');
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingId(budget.id);
    setEditAmount(budget.limitAmount.toString());
  };

  const handleSaveEdit = async (id: string) => {
    const amount = parseFloat(editAmount);
    if (!editAmount || isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    try {
      const res = await fetch('/api/budgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, limitAmount: amount }),
      });

      if (!res.ok) throw new Error('Ошибка обновления');

      const updated = await res.json();
      setBudgets(budgets.map(b => b.id === id ? updated : b));
      setEditingId(null);
      setEditAmount('');
    } catch (error) {
      console.error('Edit error:', error);
      alert('Ошибка обновления бюджета');
    }
  };

  const getProgress = (budget: Budget) => {
    const percentage = (budget.spentAmount / budget.limitAmount) * 100;
    return Math.min(percentage, 100);
  };

  const getProgressColor = (budget: Budget) => {
    const percentage = getProgress(budget);
    if (percentage < 70) return 'from-green-500 to-green-400';
    if (percentage < 90) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  const getStatus = (budget: Budget) => {
    const percentage = getProgress(budget);
    if (percentage >= 100) return { text: 'Превышен', color: 'text-red-400', emoji: '🔴' };
    if (percentage >= 90) return { text: 'Почти превышен', color: 'text-yellow-400', emoji: '🟡' };
    if (percentage >= 70) return { text: 'Хорошо', color: 'text-green-400', emoji: '🟢' };
    return { text: 'Отлично', color: 'text-green-400', emoji: '✅' };
  };

  const filteredBudgets = filterPeriod === 'all' 
    ? budgets 
    : budgets.filter(b => b.period === filterPeriod);

  if (status === 'loading' || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold gradient-text">🎯 Бюджеты и лимиты</h1>
        <BackHomeButton />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-3 border border-white/5 text-center">
          <p className="text-xs text-gray-400">Всего</p>
          <p className="text-lg font-bold text-white">{budgets.length + completedBudgets.length}</p>
        </div>
        <div className="glass rounded-2xl p-3 border border-white/5 text-center">
          <p className="text-xs text-gray-400">Активных</p>
          <p className="text-lg font-bold text-green-400">{budgets.length}</p>
        </div>
        <div className="glass rounded-2xl p-3 border border-white/5 text-center">
          <p className="text-xs text-gray-400">Завершено</p>
          <p className="text-lg font-bold text-gray-400">{completedBudgets.length}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">➕ Новый бюджет</h2>
        
        {error && (
          <div className="glass rounded-xl p-3 border border-red-500/30 bg-red-500/10 mb-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="glass rounded-xl p-3 border border-green-500/30 bg-green-500/10 mb-4">
            <p className="text-green-400 text-sm text-center">{success}</p>
          </div>
        )}

        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                📂 Категория
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="glass w-full rounded-xl border border-white/10 p-3 text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition"
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
                      {cat.icon} {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                💰 Лимит (₽)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="10000"
                className="glass w-full rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              📅 Период
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  period === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                    : 'glass-light text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                📆 Месяц
              </button>
              <button
                type="button"
                onClick={() => setPeriod('weekly')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  period === 'weekly'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                    : 'glass-light text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                📅 Неделя
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            ➕ Создать бюджет
          </button>
        </form>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterPeriod('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
            filterPeriod === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'glass-light text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setFilterPeriod('monthly')}
          className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
            filterPeriod === 'monthly'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'glass-light text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          📆 Месячные
        </button>
        <button
          onClick={() => setFilterPeriod('weekly')}
          className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
            filterPeriod === 'weekly'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'glass-light text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          📅 Недельные
        </button>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">📋 Активные бюджеты</h2>
        
        {filteredBudgets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-gray-500 text-sm">Нет активных бюджетов</p>
            <p className="text-gray-500 text-xs mt-1">Создайте бюджет для контроля расходов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBudgets.map((budget) => {
              const progress = getProgress(budget);
              const status = getStatus(budget);
              const isOverLimit = progress >= 100;
              const remaining = Math.max(budget.limitAmount - budget.spentAmount, 0);
              
              return (
                <div 
                  key={budget.id}
                  className="glass-light rounded-xl p-4 border border-white/5 hover:border-white/10 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{budget.category.icon}</span>
                      <div>
                        <h3 className="font-medium text-white">{budget.category.name}</h3>
                        <p className="text-xs text-gray-400">
                          {budget.period === 'monthly' ? '📆 Месяц' : '📅 Неделя'}
                          {' • '}
                          <span className={status.color}>
                            {status.emoji} {status.text}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        {budget.spentAmount.toFixed(2)} ₽ / {budget.limitAmount.toFixed(2)} ₽
                      </p>
                      {isOverLimit ? (
                        <p className="text-xs text-red-400 font-medium">⚠️ Лимит превышен!</p>
                      ) : (
                        <p className="text-xs text-green-400">
                          Осталось: {remaining.toFixed(2)} ₽
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full bg-gradient-to-r ${getProgressColor(budget)} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">
                      {progress.toFixed(0)}% использовано
                    </span>
                    <div className="flex gap-2">
                      {editingId === budget.id ? (
                        <>
                          <input
                            type="number"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 glass rounded-lg p-1 text-sm text-white bg-transparent border border-white/10 focus:outline-none focus:border-blue-500/50"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(budget.id)}
                            className="text-xs text-green-400 hover:text-green-300 transition"
                          >
                            💾
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-400 hover:text-white transition"
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="text-xs text-red-400 hover:text-red-300 transition"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {completedBudgets.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">📜 История</h2>
          <div className="space-y-2">
            {completedBudgets.slice(0, 5).map((budget) => (
              <div 
                key={budget.id}
                className="flex justify-between items-center p-3 rounded-xl glass-light border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{budget.category.icon}</span>
                  <span className="text-sm text-gray-300">{budget.category.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    {budget.spentAmount.toFixed(0)} / {budget.limitAmount.toFixed(0)} ₽
                  </p>
                  <p className="text-xs text-gray-500">
                    {budget.period === 'monthly' ? '📆 Месяц' : '📅 Неделя'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}