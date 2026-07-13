'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AdminGuard from '@/app/components/AdminGuard';
import LoadingScreen from '@/app/components/LoadingScreen';
import BackHomeButton from '@/app/components/BackHomeButton';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    transactions: number;
    categories: number;
    budgets: number;
  };
};

type Stats = {
  users: number;
  transactions: number;
  categories: number;
  budgets: number;
  totalAmount: number;
  recentTransactions: any[];
};

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
      ]);

      if (!usersRes.ok || !statsRes.ok) {
        throw new Error('Ошибка загрузки');
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Удалить пользователя?')) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');

      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Ошибка удаления пользователя');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AdminGuard>
      <div className="p-4 space-y-6 max-w-6xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-2xl font-bold gradient-text">🛡️ Админ-панель</h1>
          <BackHomeButton />
        </div>

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-xs text-gray-400">Пользователи</p>
              <p className="text-xl font-bold text-white">{stats.users}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-xs text-gray-400">Транзакции</p>
              <p className="text-xl font-bold text-white">{stats.transactions}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-xs text-gray-400">Категории</p>
              <p className="text-xl font-bold text-white">{stats.categories}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-xs text-gray-400">Бюджеты</p>
              <p className="text-xl font-bold text-white">{stats.budgets}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-xs text-gray-400">Всего денег</p>
              <p className="text-xl font-bold text-green-400">{stats.totalAmount.toFixed(0)} ₽</p>
            </div>
          </div>
        )}

        {/* Табы */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'users'
                ? 'glass border border-blue-500/50 text-white'
                : 'glass-light text-gray-400 hover:text-white'
            }`}
          >
            👥 Пользователи
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'stats'
                ? 'glass border border-blue-500/50 text-white'
                : 'glass-light text-gray-400 hover:text-white'
            }`}
          >
            📊 Транзакции
          </button>
        </div>

        {/* Пользователи */}
        {activeTab === 'users' && (
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">👥 Пользователи</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/5">
                    <th className="pb-2">Имя</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Роль</th>
                    <th className="pb-2 text-center">Транзакции</th>
                    <th className="pb-2 text-center">Категории</th>
                    <th className="pb-2 text-center">Бюджеты</th>
                    <th className="pb-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 text-white">{user.name}</td>
                      <td className="py-3 text-gray-300">{user.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          user.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {user.role === 'admin' ? '👑 Админ' : '👤 Пользователь'}
                        </span>
                      </td>
                      <td className="py-3 text-center text-gray-300">{user._count.transactions}</td>
                      <td className="py-3 text-center text-gray-300">{user._count.categories}</td>
                      <td className="py-3 text-center text-gray-300">{user._count.budgets}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-400 hover:text-red-300 transition text-xs px-2 py-1 rounded-lg hover:bg-red-500/10"
                          disabled={user.id === session?.user?.id}
                        >
                          {user.id === session?.user?.id ? '🔒' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Транзакции */}
        {activeTab === 'stats' && stats?.recentTransactions && (
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">📊 Последние транзакции</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/5">
                    <th className="pb-2">Пользователь</th>
                    <th className="pb-2">Категория</th>
                    <th className="pb-2 text-right">Сумма</th>
                    <th className="pb-2 text-right">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 text-white">{tx.user?.name || 'Unknown'}</td>
                      <td className="py-3 text-gray-300">
                        {tx.category?.icon} {tx.category?.name || 'Без категории'}
                      </td>
                      <td className={`py-3 text-right font-medium ${
                        tx.category?.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.category?.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} ₽
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        {new Date(tx.date).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Кнопка обновления */}
        <button
          onClick={fetchData}
          className="w-full glass rounded-xl py-2 text-sm text-gray-400 hover:text-white transition"
        >
          🔄 Обновить данные
        </button>
      </div>
    </AdminGuard>
  );
}