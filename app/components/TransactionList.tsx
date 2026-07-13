'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import EditModal from './EditModal';
import { useToast } from './ToastProvider';
import { formatMoneyWithSign } from '@/app/lib/formatMoney';

type Transaction = {
  id: string;
  amount: number;
  categoryId: string;
  description?: string;
  date: string;
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

type Props = {
  transactions: Transaction[];
  categories: Category[];
  onUpdate: (updated: Transaction[]) => void;
};

export default function TransactionList({ transactions, categories, onUpdate }: Props) {
  const { showToast } = useToast();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // ⭐ Убираем автофокус — теперь фокус только при клике на поле
  // useEffect(() => {
  //   searchInputRef.current?.focus();
  // }, []);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim();
          const desc = (tx.description || '').toLowerCase();
          const catName = (cat?.name || '').toLowerCase();
          if (!desc.includes(query) && !catName.includes(query)) {
            return false;
          }
        }
        
        if (filterType !== 'all' && cat?.type !== filterType) {
          return false;
        }
        
        if (filterCategory !== 'all' && tx.categoryId !== filterCategory) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [transactions, categories, searchQuery, filterType, filterCategory, sortOrder]);

  const grouped = useMemo(() => {
    return filteredTransactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = [];
      acc[tx.date].push(tx);
      return acc;
    }, {});
  }, [filteredTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm('🗑️ Вы уверены, что хотите удалить эту транзакцию?')) return;

    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');

      const updated = transactions.filter(tx => tx.id !== id);
      onUpdate(updated);
      showToast('🗑️ Транзакция удалена', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('❌ Ошибка удаления транзакции', 'error');
    }
  };

  const handleSaveEdit = async (updatedTx: Transaction) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx),
      });

      if (!res.ok) throw new Error('Ошибка обновления');

      const updated = transactions.map(tx => 
        tx.id === updatedTx.id ? updatedTx : tx
      );
      onUpdate(updated);
      setIsModalOpen(false);
      setEditingTransaction(null);
      showToast('✏️ Транзакция обновлена', 'success');
    } catch (error) {
      console.error('Edit error:', error);
      showToast('❌ Ошибка обновления транзакции', 'error');
    }
  };

  const getTransactionType = (tx: Transaction) => {
    const cat = categories.find(c => c.id === tx.categoryId);
    return cat?.type === 'income' ? 'income' : 'expense';
  };

  const totalFiltered = filteredTransactions.reduce((sum, tx) => {
    const type = getTransactionType(tx);
    return type === 'income' ? sum + tx.amount : sum - tx.amount;
  }, 0);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterCategory('all');
    // Убираем автофокус
    // setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-gray-500 text-sm">Пока нет транзакций</p>
        <p className="text-gray-500 text-xs mt-1">Добавьте первую трату или доход</p>
      </div>
    );
  }

  if (filteredTransactions.length === 0 && transactions.length > 0) {
    return (
      <div>
        <div className="mb-4 space-y-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="🔍 Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  // Убираем автофокус
                  // setTimeout(() => searchInputRef.current?.focus(), 0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs transition ${
                filterType === 'all'
                  ? 'glass border border-blue-500/50 text-white'
                  : 'glass-light text-gray-400 hover:text-white'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs transition ${
                filterType === 'expense'
                  ? 'glass border border-red-500/50 text-red-400'
                  : 'glass-light text-gray-400 hover:text-white'
              }`}
            >
              📉 Расходы
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs transition ${
                filterType === 'income'
                  ? 'glass border border-green-500/50 text-green-400'
                  : 'glass-light text-gray-400 hover:text-white'
              }`}
            >
              📈 Доходы
            </button>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="glass rounded-lg border border-white/10 px-2 py-1 text-[10px] sm:text-xs text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition max-w-[100px] sm:max-w-none"
            >
              <option value="all" className="bg-[#0a0a0f]">Все категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="glass rounded-lg px-2.5 py-1 text-[10px] sm:text-xs text-gray-400 hover:text-white transition"
            >
              {sortOrder === 'desc' ? '⬇️ Новые' : '⬆️ Старые'}
            </button>
            
            {(searchQuery || filterType !== 'all' || filterCategory !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 transition px-2 py-1"
              >
                ✕ Сброс
              </button>
            )}
          </div>
        </div>

        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-500 text-sm">Ничего не найдено</p>
          <button
            onClick={resetFilters}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            Сбросить все фильтры
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 space-y-2">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="🔍 Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs transition ${
              filterType === 'all'
                ? 'glass border border-blue-500/50 text-white'
                : 'glass-light text-gray-400 hover:text-white'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs transition ${
              filterType === 'expense'
                ? 'glass border border-red-500/50 text-red-400'
                : 'glass-light text-gray-400 hover:text-white'
            }`}
          >
            📉 Расходы
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs transition ${
              filterType === 'income'
                ? 'glass border border-green-500/50 text-green-400'
                : 'glass-light text-gray-400 hover:text-white'
            }`}
          >
            📈 Доходы
          </button>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="glass rounded-lg border border-white/10 px-2 py-1 text-[10px] sm:text-xs text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition max-w-[100px] sm:max-w-none"
          >
            <option value="all" className="bg-[#0a0a0f]">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="glass rounded-lg px-2.5 py-1 text-[10px] sm:text-xs text-gray-400 hover:text-white transition"
          >
            {sortOrder === 'desc' ? '⬇️ Новые' : '⬆️ Старые'}
          </button>
          
          {(searchQuery || filterType !== 'all' || filterCategory !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 transition px-2 py-1"
            >
              ✕ Сброс
            </button>
          )}
        </div>
        
        {filteredTransactions.length > 0 && (
          <div className="text-right">
            <span className={`text-[10px] sm:text-xs ${totalFiltered >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Итого: {totalFiltered >= 0 ? '+' : ''}{formatMoneyWithSign(totalFiltered, totalFiltered < 0)}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 ml-2">
              ({filteredTransactions.length})
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([date, txs]) => {
          const dayTotal = txs.reduce((sum, tx) => {
            const type = getTransactionType(tx);
            return type === 'income' ? sum + tx.amount : sum - tx.amount;
          }, 0);

          return (
            <div key={date}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-400">
                  {format(parseISO(date), 'dd MMMM yyyy', { locale: ru })}
                </h3>
                <span className={`text-[10px] sm:text-xs font-medium ${dayTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatMoneyWithSign(dayTotal, dayTotal < 0)}
                </span>
              </div>
              
              <div className="space-y-1">
                {txs.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const isExpense = cat?.type === 'expense';
                  
                  return (
                    <div 
                      key={tx.id} 
                      className="glass-light rounded-xl p-2.5 sm:p-3 border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0"
                            style={{ background: `${cat?.color}20`, border: `1px solid ${cat?.color}30` }}
                          >
                            {cat?.icon || '📌'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="font-medium text-xs sm:text-sm text-white truncate">
                                {cat?.name || 'Без категории'}
                              </span>
                              {tx.description && (
                                <span className="text-[10px] sm:text-xs text-gray-400 truncate hidden sm:inline">
                                  — {tx.description}
                                </span>
                              )}
                            </div>
                            {tx.description && (
                              <div className="text-[10px] sm:text-xs text-gray-500 truncate sm:hidden">
                                {tx.description}
                              </div>
                            )}
                            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                              {format(parseISO(tx.date), 'HH:mm')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                          <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                            {formatMoneyWithSign(tx.amount, isExpense)}
                          </span>
                          
                          <div className="flex gap-0.5 sm:gap-1">
                            <button
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsModalOpen(true);
                              }}
                              className="p-1 sm:p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition"
                              title="Редактировать"
                            >
                              <span className="text-xs sm:text-sm">✏️</span>
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1 sm:p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                              title="Удалить"
                            >
                              <span className="text-xs sm:text-sm">🗑️</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <EditModal
        isOpen={isModalOpen}
        transaction={editingTransaction}
        categories={categories}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveEdit}
      />
    </>
  );
}