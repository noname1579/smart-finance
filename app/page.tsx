'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingScreen from './components/LoadingScreen';
import Logo from './components/Logo';
import CategoryPieChart from './components/CategoryPieChart';
import TransactionList from './components/TransactionList';
import ScanButton from './components/ScanButton';
import { format, parseISO, isToday, isThisMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
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
  description?: string;
  date: string;
  createdAt: string;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

      console.log('📊 Загружено транзакций:', txs.length);
      console.log('📂 Загружено категорий:', cats.length);

      setTransactions(txs);
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTransactions = async (updated: Transaction[]) => {
    setTransactions(updated);
  };

  if (status === 'loading' || isLoading) {
    return <LoadingScreen />;
  }

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
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pt-4">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">{session?.user?.name}</span>
          <Link
            href="/api/auth/signout"
            className="glass rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-white/5 transition"
            title="Выйти"
          >
            <span className="text-lg">🚪</span>
          </Link>
        </div>
      </div>

      {/* Balance Card */}
      <div className="glass rounded-2xl p-6 glow border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <p className="text-sm text-gray-400 relative z-10">Общий баланс</p>
        <p className={`text-4xl font-bold relative z-10 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatMoney(balance)}
        </p>
        
        <div className="flex gap-6 mt-4 relative z-10">
          <div>
            <p className="text-xs text-green-400/60">Доходы</p>
            <p className="text-sm font-semibold text-green-400">+{formatMoney(totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-red-400/60">Расходы</p>
            <p className="text-sm font-semibold text-red-400">-{formatMoney(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 border border-white/5 hover-scale">
          <p className="text-xs text-gray-400">Сегодня</p>
          <p className="text-xl font-bold text-red-400">
            {formatMoney(todaySpend)}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/5 hover-scale">
          <p className="text-xs text-gray-400">За месяц</p>
          <p className="text-xl font-bold text-red-400">
            {formatMoney(monthSpend)}
          </p>
        </div>
      </div>

      {/* ⭐ ГРАФИК — ПЕРЕДАЁМ ПРОПСЫ */}
      <div className="glass rounded-2xl p-5 border border-white/5 hover-scale">
        <h2 className="text-sm font-semibold mb-3 text-gray-300">Расходы по категориям</h2>
        <CategoryPieChart transactions={transactions} categories={categories} />
      </div>

      {/* Transactions List */}
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
        <ScanButton 
          categories={categories}
          onTransactionAdded={fetchData}
        />
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