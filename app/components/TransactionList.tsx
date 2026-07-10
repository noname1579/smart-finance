'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getFromStorage, setToStorage } from '../lib/storage';
import EditModal from './EditModal';

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
  onUpdate: (updated: Transaction[]) => void; // ← Добавлено!
};

export default function TransactionList({ transactions, categories, onUpdate }: Props) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Сортировка от новых к старым
  const sorted = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Группировка по дням
  const grouped = sorted.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  // Удаление транзакции
  const handleDelete = (id: string) => {
    if (window.confirm('🗑️ Вы уверены, что хотите удалить эту транзакцию?')) {
      const updated = transactions.filter(tx => tx.id !== id);
      setToStorage('transactions', updated);
      onUpdate(updated);
    }
  };

  // Открытие модалки для редактирования
  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  // Сохранение изменений
  const handleSaveEdit = (updatedTx: Transaction) => {
    const updated = transactions.map(tx => 
      tx.id === updatedTx.id ? updatedTx : tx
    );
    setToStorage('transactions', updated);
    onUpdate(updated);
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-gray-500 text-sm">Пока нет транзакций</p>
        <p className="text-gray-500 text-xs mt-1">Добавьте первую трату или доход</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, txs]) => {
          // Считаем сумму за день
          const dayTotal = txs.reduce((sum, tx) => {
            const cat = categories.find(c => c.id === tx.categoryId);
            return cat?.type === 'expense' ? sum + tx.amount : sum - tx.amount;
          }, 0);

          return (
            <div key={date}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-400">
                  {format(parseISO(date), 'dd MMMM yyyy', { locale: ru })}
                </h3>
                <span className={`text-xs font-medium ${dayTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {dayTotal >= 0 ? '+' : ''}{dayTotal.toFixed(2)} ₽
                </span>
              </div>
              
              <div className="space-y-1">
                {txs.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const isExpense = cat?.type === 'expense';
                  
                  return (
                    <div 
                      key={tx.id} 
                      className="glass-light rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        {/* Левая часть: иконка + информация */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ background: `${cat?.color}20`, border: `1px solid ${cat?.color}30` }}
                          >
                            {cat?.icon || '📌'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-white truncate">
                                {cat?.name || 'Без категории'}
                              </span>
                              {tx.description && (
                                <span className="text-xs text-gray-400 truncate hidden sm:inline">
                                  — {tx.description}
                                </span>
                              )}
                            </div>
                            {tx.description && (
                              <div className="text-xs text-gray-500 truncate sm:hidden">
                                {tx.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-0.5">
                              {format(parseISO(tx.date), 'HH:mm')}
                            </div>
                          </div>
                        </div>

                        {/* Правая часть: сумма + кнопки */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-sm font-semibold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                            {isExpense ? '-' : '+'}{tx.amount.toFixed(2)} ₽
                          </span>
                          
                          {/* Кнопки действий (появляются при ховере) */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(tx)}
                              className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition"
                              title="Редактировать"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                              title="Удалить"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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

      {/* Модальное окно редактирования */}
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