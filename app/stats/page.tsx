'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CategoryPieChart from '../components/CategoryPieChart';
import LoadingScreen from '../components/LoadingScreen';
import BackHomeButton from '../components/BackHomeButton';
import { formatMoney } from '@/app/lib/formatMoney';

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
    d.setDate(now.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    const dayExpenses = transactions.filter(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const isExpense = cat?.type === 'expense';
      const txDate = new Date(tx.date).toISOString().split('T')[0];
      return isExpense && txDate === dateStr;
    });
    
    const total = dayExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      date: dateStr,
      day: d.getDate(),
      month: d.toLocaleString('ru', { month: 'short' }),
      total,
      dayOfWeek: d.toLocaleString('ru', { weekday: 'short' }),
      isToday: dateStr === now.toISOString().split('T')[0],
    };
  });

  const maxDayTotal = Math.max(...dayStats.map(d => d.total), 1);
  const average = dayStats.reduce((sum, d) => sum + d.total, 0) / 7;
  const hasExpenses = dayStats.some(d => d.total > 0);
  const weekTotal = dayStats.reduce((sum, d) => sum + d.total, 0);

  const expenses = dayStats.filter(d => d.total > 0);
  const maxExpense = expenses.length > 0 ? Math.max(...expenses.map(d => d.total)) : 0;

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold gradient-text">📊 Статистика</h1>
        <BackHomeButton />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 border border-white/5 hover-scale">
          <p className="text-xs text-gray-400">💰 Доходы</p>
          <p className="text-xl font-bold text-green-400">
            {formatMoney(totalIncome)}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/5 hover-scale">
          <p className="text-xs text-gray-400">💸 Расходы</p>
          <p className="text-xl font-bold text-red-400">
            {formatMoney(totalExpense)}
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5 glow">
        <p className="text-xs text-gray-400">Остаток</p>
        <p className={`text-2xl font-bold ${
          totalIncome - totalExpense >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {formatMoney(totalIncome - totalExpense)}
        </p>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-300">📈 Расходы за неделю</h2>
          {hasExpenses && (
            <span className="text-xs text-gray-500">
              Всего: <span className="text-gray-300">{formatMoney(weekTotal)}</span>
            </span>
          )}
        </div>

        {!hasExpenses ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Нет расходов за эту неделю</p>
            <p className="text-xs text-gray-600 mt-1">Добавьте первую трату</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-40">
              {dayStats.map((day, index) => {
                const height = day.total > 0 ? (day.total / maxDayTotal) * 100 : 0;
                
                let colorStyle = {};
                if (day.total === 0) {
                  colorStyle = { backgroundColor: 'rgba(255,255,255,0.05)', height: '4px' };
                } else {
                  const ratio = day.total / maxExpense;
                  
                  if (ratio < 0.3) {
                    colorStyle = { background: 'linear-gradient(to top, #22c55e, #4ade80)' };
                  } else if (ratio < 0.6) {
                    colorStyle = { background: 'linear-gradient(to top, #eab308, #facc15)' };
                  } else {
                    colorStyle = { background: 'linear-gradient(to top, #ef4444, #f87171)' };
                  }
                }
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-[10px] ${day.total > 0 ? 'text-gray-300 font-medium' : 'text-gray-600'}`}>
                      {day.total > 0 ? `${formatMoney(day.total)}` : ''}
                    </span>
                    
                    <div 
                      className="w-full max-w-[40px] rounded-t-lg transition-all duration-500"
                      style={{ 
                        height: day.total > 0 ? `${Math.max(height * 0.85, 4)}px` : '4px',
                        ...colorStyle
                      }}
                    />
                    
                    <div className="text-center">
                      <span className="text-[10px] text-gray-300">
                        {day.dayOfWeek}
                      </span>
                      <span className="text-[8px] text-gray-400 block">
                        {day.day} {day.month}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative pt-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500">Мин</span>
                <span className="text-[10px] text-gray-500">Макс</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(maxExpense / maxDayTotal) * 100}%` 
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              <div className="text-center">
                <p className="text-[10px] text-gray-500">Всего</p>
                <p className="text-sm font-semibold text-white">
                  {formatMoney(weekTotal)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500">Средний</p>
                <p className="text-sm font-semibold text-gray-300">
                  {formatMoney(average)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500">Максимум</p>
                <p className="text-sm font-semibold text-red-400">
                  {formatMoney(maxExpense)}
                </p>
              </div>
            </div>
          </div>
        )}
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
                        <span className="text-red-400">{formatMoney(cat.total)}</span>
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
                    <span className="text-red-400">{formatMoney(total)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-500"
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