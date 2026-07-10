'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFromStorage, setToStorage } from './lib/storage';
import CategoryPieChart from './components/CategoryPieChart';
import TransactionList from './components/TransactionList';
import ScanButton from './components/ScanButton';
import { format, parseISO, isToday, isThisMonth } from 'date-fns';
import { ru } from 'date-fns/locale';

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

const defaultCategories: Category[] = [
  { id: 'food', name: 'Еда', icon: '🍔', color: '#FF6384', type: 'expense' },
  { id: 'transport', name: 'Транспорт', icon: '🚗', color: '#36A2EB', type: 'expense' },
  { id: 'housing', name: 'Жильё', icon: '🏠', color: '#FFCE56', type: 'expense' },
  { id: 'entertainment', name: 'Развлечения', icon: '🎮', color: '#4BC0C0', type: 'expense' },
  { id: 'salary', name: 'Зарплата', icon: '💰', color: '#FF9F40', type: 'income' },
  { id: 'other', name: 'Прочее', icon: '📦', color: '#9966FF', type: 'expense' },
];

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories] = useState<Category[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка данных при монтировании
  useEffect(() => {
    const saved = getFromStorage<Transaction[]>('transactions', []);
    setTransactions(saved);
    setIsLoading(false);
  }, []);

  // Сохранение при изменении
  useEffect(() => {
    if (!isLoading) {
      setToStorage('transactions', transactions);
    }
  }, [transactions, isLoading]);

  // Функция обновления транзакций (передаётся в TransactionList)
  const handleUpdateTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    setToStorage('transactions', updated);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Загрузка...</p>
      </div>
    );
  }

  // Расчеты
  const totalIncome = transactions
    .filter(tx => categories.find(c => c.id === tx.categoryId)?.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter(tx => categories.find(c => c.id === tx.categoryId)?.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpense;

  const todaySpend = transactions
    .filter(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return cat?.type === 'expense' && isToday(parseISO(tx.date));
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthSpend = transactions
    .filter(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return cat?.type === 'expense' && isThisMonth(parseISO(tx.date));
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            SmartFinance
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {format(new Date(), 'dd MMMM yyyy', { locale: ru })}
          </p>
        </div>
        <div className="glass rounded-full p-2 w-10 h-10 flex items-center justify-center">
          <span className="text-lg">👤</span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="glass rounded-2xl p-6 glow border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <p className="text-sm text-gray-400 relative z-10">Общий баланс</p>
        <p className="text-4xl font-bold relative z-10">
          {balance.toLocaleString()} ₽
        </p>
        
        <div className="flex gap-6 mt-4 relative z-10">
          <div>
            <p className="text-xs text-green-400/60">Доходы</p>
            <p className="text-sm font-semibold text-green-400">+{totalIncome.toLocaleString()} ₽</p>
          </div>
          <div>
            <p className="text-xs text-red-400/60">Расходы</p>
            <p className="text-sm font-semibold text-red-400">-{totalExpense.toLocaleString()} ₽</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 border border-white/5 hover-scale">
          <p className="text-xs text-gray-400">Сегодня</p>
          <p className="text-xl font-bold text-red-400">
            {todaySpend.toLocaleString()} ₽
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/5 hover-scale">
          <p className="text-xs text-gray-400">За месяц</p>
          <p className="text-xl font-bold text-red-400">
            {monthSpend.toLocaleString()} ₽
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="glass rounded-2xl p-5 border border-white/5 hover-scale">
        <h2 className="text-sm font-semibold mb-3 text-gray-300">Расходы по категориям</h2>
        <CategoryPieChart transactions={transactions} categories={categories} />
      </div>

      {/* Transactions List with Edit/Delete */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-300">История</h2>
          <span className="text-xs text-gray-500">{transactions.length} записей</span>
        </div>
        <TransactionList 
          transactions={transactions} 
          categories={categories}
          onUpdate={handleUpdateTransactions}
        />
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-50">
        <ScanButton />
        <Link
          href="/add"
          className="bg-blue-600 text-white p-3.5 rounded-full shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 shadow-blue-500/20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>
    </div>
  );
}