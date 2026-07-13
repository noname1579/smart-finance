'use client';

import { useState } from 'react';
import ScanReceiptModal from './ScanReceiptModal';
import { useToast } from './ToastProvider';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

type Props = {
  categories: Category[];
  onTransactionAdded?: () => void;
};

export default function ScanButton({ categories, onTransactionAdded }: Props) {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsModalOpen(true);
  };

  const handleConfirm = async (data: {
    amount: number;
    categoryId: string;
    description: string;
    date: string;
  }) => {
    setIsScanning(true);
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data.amount,
          categoryId: data.categoryId,
          description: data.description || 'Сканированный чек',
          date: data.date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания транзакции');
      }

      showToast('✅ Транзакция из чека добавлена!', 'success');
      setIsModalOpen(false);
      
      if (onTransactionAdded) {
        onTransactionAdded();
      }
      
      // Перезагружаем страницу для обновления данных
      window.location.reload();
    } catch (error) {
      console.error('Error creating transaction:', error);
      showToast('❌ Ошибка добавления транзакции', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
      <button
        onClick={handleScan}
        disabled={isScanning}
        className={`relative bg-gradient-to-br from-purple-600 to-pink-600 text-white p-3.5 rounded-full shadow-2xl transition-all hover:scale-110 shadow-purple-500/20 ${
          isScanning ? 'animate-pulse opacity-50' : 'hover:shadow-purple-500/30'
        }`}
        title="Сканировать чек"
      >
        {isScanning ? (
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>

      <ScanReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        categories={categories}
      />
    </>
  );
}