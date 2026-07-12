'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from './ToastProvider';
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
  onUpdate: (updated: Transaction[]) => void;
};

export default function TransactionList({ transactions, categories, onUpdate }: Props) {
  const { showToast } = useToast();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sorted = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const grouped = sorted.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  // Удаление через API
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

  // Редактирование через API
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

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-sm font-semibold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                            {isExpense ? '-' : '+'}{tx.amount.toFixed(2)} ₽
                          </span>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition"
                              title="Редактировать"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                              title="Удалить"
                            >
                              🗑️
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