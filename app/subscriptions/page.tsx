'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoadingScreen from '../components/LoadingScreen';
import BackHomeButton from '../components/BackHomeButton';
import { useToast } from '../components/ToastProvider';
import { formatMoney } from '@/app/lib/formatMoney';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  category: Category;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string | null;
  nextDate: string;
  description: string | null;
  isActive: boolean;
};

const FREQUENCY_LABELS = {
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  yearly: 'Ежегодно',
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Форма создания
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, catsRes] = await Promise.all([
        fetch('/api/recurring-payments'),
        fetch('/api/categories'),
      ]);

      if (!paymentsRes.ok || !catsRes.ok) {
        throw new Error('Ошибка загрузки данных');
      }

      const paymentsData = await paymentsRes.json();
      const catsData = await catsRes.json();

      setPayments(paymentsData);
      setCategories(catsData.filter((c: Category) => c.type === 'expense'));
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('❌ Ошибка загрузки данных', 'error');
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
      fetchData();
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [session, status, router, fetchData]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !amount || !categoryId || !startDate) {
      setError('Заполните все поля');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      setError('Сумма должна быть больше 0');
      return;
    }

    try {
      const res = await fetch('/api/recurring-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          amount: numAmount,
          categoryId,
          frequency,
          startDate,
          endDate: endDate || null,
          description: description.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка создания');
        return;
      }

      setPayments([data, ...payments]);
      setSuccess('✅ Регулярный платёж создан!');
      
      // Сброс формы
      setName('');
      setAmount('');
      setCategoryId('');
      setFrequency('monthly');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setDescription('');
      setShowForm(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Произошла ошибка');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Удалить регулярный платёж?')) return;

    try {
      const res = await fetch(`/api/recurring-payments?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');

      setPayments(payments.filter(p => p.id !== id));
      showToast('🗑️ Платёж удалён', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('❌ Ошибка удаления', 'error');
    }
  };

  // Рассчитываем, сколько дней до следующего платежа
  const getDaysUntil = (nextDate: string) => {
    const now = new Date();
    const next = new Date(nextDate);
    const diffTime = next.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (status === 'loading' || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold gradient-text">🔄 Подписки и регулярные платежи</h1>
        <BackHomeButton />
      </div>

      {/* Кнопка добавления */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full glass rounded-2xl p-4 border border-white/5 hover:border-white/10 transition text-left"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">
            {showForm ? '❌ Закрыть форму' : '➕ Добавить регулярный платёж'}
          </span>
          <span className="text-2xl">{showForm ? '−' : '➕'}</span>
        </div>
      </button>

      {/* Форма создания */}
      {showForm && (
        <div className="glass rounded-2xl p-5 border border-white/5">
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

          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  📝 Название
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Netflix, Spotify, Аренда..."
                  className="glass w-full rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  💰 Сумма (₽)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                  className="glass w-full rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>
            </div>

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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  🔄 Периодичность
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="glass w-full rounded-xl border border-white/10 p-3 text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition"
                >
                  <option value="daily" className="bg-[#0a0a0f]">Ежедневно</option>
                  <option value="weekly" className="bg-[#0a0a0f]">Еженедельно</option>
                  <option value="monthly" className="bg-[#0a0a0f]">Ежемесячно</option>
                  <option value="yearly" className="bg-[#0a0a0f]">Ежегодно</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  📅 Дата начала
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass w-full rounded-xl border border-white/10 p-3 text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  📅 Дата окончания (необязательно)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass w-full rounded-xl border border-white/10 p-3 text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                📝 Примечание (необязательно)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительная информация"
                className="glass w-full rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ✅ Добавить регулярный платёж
            </button>
          </form>
        </div>
      )}

      {/* Список платежей */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-300">📋 Активные подписки</h2>
          <span className="text-xs text-gray-500">{payments.length} записей</span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔄</div>
            <p className="text-gray-500 text-sm">Нет активных подписок</p>
            <p className="text-gray-500 text-xs mt-1">Добавьте регулярные платежи для автоматического учёта</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const daysUntil = getDaysUntil(payment.nextDate);
              const isUrgent = daysUntil <= 3;
              
              return (
                <div 
                  key={payment.id}
                  className="glass-light rounded-xl p-4 border border-white/5 hover:border-white/10 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${payment.category.color}20`, border: `1px solid ${payment.category.color}30` }}
                      >
                        {payment.category.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{payment.name}</h3>
                        <p className="text-xs text-gray-400">
                          {payment.category.name} • {FREQUENCY_LABELS[payment.frequency]}
                        </p>
                        {payment.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{payment.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-400">
                        {formatMoney(payment.amount)}
                      </p>
                      <p className={`text-xs ${isUrgent ? 'text-orange-400' : 'text-gray-400'}`}>
                        {isUrgent ? '⚠️' : ''} через {daysUntil} дн.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                    <p className="text-xs text-gray-500">
                      📅 {format(parseISO(payment.startDate), 'dd MMM yyyy', { locale: ru })}
                      {payment.endDate && ` → ${format(parseISO(payment.endDate), 'dd MMM yyyy', { locale: ru })}`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Информация о том, как это работает */}
      <div className="glass rounded-2xl p-4 border border-white/5">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">💡 Как это работает</h3>
        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
          <li>Регулярные платежи автоматически создают транзакции в день списания</li>
          <li>Вы получите уведомление за 3 дня до списания</li>
          <li>Можно отключить платёж в любое время</li>
          <li>Все платежи привязаны к категориям для удобной статистики</li>
        </ul>
      </div>
    </div>
  );
}