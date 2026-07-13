'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CategoryPieChart from '../components/CategoryPieChart';
import LoadingScreen from '../components/LoadingScreen';

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
  date: string;
  description?: string;
};

export default function StatsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session) {
      fetchData();
    }
  }, [session, status, router]);

  const fetchData = async () => {
    if (!session) return;
    
    try {
      setIsLoading(true);
      
      const [txsRes, catsRes] = await Promise.all([
        fetch('/api/transactions', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch('/api/categories', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }),
      ]);

      if (!txsRes.ok || !catsRes.ok) {
        throw new Error('Ошибка загрузки данных');
      }

      const txs = await txsRes.json();
      const cats = await catsRes.json();

      setTransactions(txs);
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <LoadingScreen />;
  }

  const totalExpense = transactions
    .filter(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return cat?.type === 'expense';
    })
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalIncome = transactions
    .filter(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return cat?.type === 'income';
    })
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const categoryStats = categories
    .filter(cat => cat.type === 'expense')
    .map(cat => {
      const total = transactions
        .filter(tx => tx.categoryId === cat.id)
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      return { ...cat, total };
    })
    .filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const monthStats = transactions
    .filter(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return cat?.type === 'expense';
    })
    .reduce<Record<string, number>>((acc, tx) => {
      const month = tx.date.substring(0, 7);
      acc[month] = (acc[month] || 0) + (tx.amount || 0);
      return acc;
    }, {});

  const sortedMonths = Object.entries(monthStats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);

  const now = new Date();
  const dayStats = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const total = transactions
      .filter(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        return cat?.type === 'expense' && tx.date === dateStr;
      })
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    return {
      date: dateStr,
      day: d.getDate(),
      month: d.toLocaleString('ru', { month: 'short' }),
      total
    };
  });

  const maxDayTotal = Math.max(...dayStats.map(d => d.total), 1);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      {/* Шапка - только стрелка и заголовок */}
      <div className="flex items-center gap-3 pt-4">
        <button 
          onClick={() => router.back()}
          className="glass rounded-full p-2 hover:bg-white/5 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold gradient-text">Статистика</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 border border-white/5 hover-scale">
          <p className="text-xs text-gray-400">💰 Доходы</p>
          <p className="text-xl font-bold text-green-400">
            {totalIncome.toFixed(2)} ₽
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/5 hover-scale">
          <p className="text-xs text-gray-400">💸 Расходы</p>
          <p className="text-xl font-bold text-red-400">
            {totalExpense.toFixed(2)} ₽
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5 glow">
        <p className="text-xs text-gray-400">Остаток</p>
        <p className={`text-2xl font-bold ${
          totalIncome - totalExpense >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {(totalIncome - totalExpense).toFixed(2)} ₽
        </p>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">📈 Расходы за неделю</h2>
        <div className="flex items-end gap-2 h-32">
          {dayStats.map((day, index) => {
            const height = day.total > 0 ? (day.total / maxDayTotal) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full rounded-lg transition-all duration-500"
                  style={{ 
                    height: `${Math.max(height * 0.9, 4)}%`,
                    background: day.total > 0 
                      ? `linear-gradient(180deg, #3b82f6, ${day.total / maxDayTotal > 0.5 ? '#60a5fa' : '#93c5fd'})`
                      : 'rgba(255,255,255,0.05)'
                  }}
                />
                <span className="text-[10px] text-gray-500">{day.day}</span>
                <span className="text-[8px] text-gray-600">{day.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold mb-3 text-gray-300">Расходы по категориям</h2>
        <CategoryPieChart transactions={transactions} categories={categories} />
      </div>

      {categoryStats.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h2 className="text-sm font-semibold mb-3 text-gray-300">🏆 Топ категорий</h2>
          <div className="space-y-3">
            {categoryStats.slice(0, 5).map((cat) => {
              const max = categoryStats[0]?.total || 1;
              const percentage = (cat.total / max) * 100;
              
              return (
                <div key={cat.id} className="hover-scale">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 glass rounded-xl flex items-center justify-center text-lg shrink-0">
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">{cat.name}</span>
                        <span className="text-red-400">{cat.total.toFixed(2)} ₽</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            background: cat.color 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sortedMonths.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h2 className="text-sm font-semibold mb-3 text-gray-300">📅 Динамика расходов</h2>
          <div className="space-y-2">
            {sortedMonths.map(([month, total]) => {
              const max = Math.max(...Object.values(monthStats));
              const percentage = max > 0 ? (total / max) * 100 : 0;
              const date = new Date(month + '-01');
              const monthName = date.toLocaleString('ru', { month: 'long' });
              
              return (
                <div key={month}>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{monthName}</span>
                    <span className="text-red-400">{total.toFixed(2)} ₽</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold mb-3 text-gray-300">📋 Итого</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Всего транзакций</p>
            <p className="text-lg font-bold text-blue-400">{transactions.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Средний расход</p>
            <p className="text-lg font-bold text-gray-300">
              {transactions.length > 0 
                ? (totalExpense / transactions.filter(tx => 
                    categories.find(c => c.id === tx.categoryId)?.type === 'expense'
                  ).length || 0).toFixed(2) 
                : '0.00'} ₽
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}