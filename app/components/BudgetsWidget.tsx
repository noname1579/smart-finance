'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatMoney } from '@/app/lib/formatMoney';

type Budget = {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  limitAmount: number;
  spentAmount: number;
  period: 'monthly' | 'weekly';
};

export default function BudgetsWidget() {
  const { data: session } = useSession();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchBudgets();
    }
  }, [session]);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-gray-500">Загрузка...</p>;
  }

  if (budgets.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-gray-500">Нет активных бюджетов</p>
        <Link href="/budgets" className="text-xs text-blue-400 hover:text-blue-300 transition">
          Создать бюджет →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {budgets.slice(0, 3).map((budget) => {
        const percentage = Math.min((budget.spentAmount / budget.limitAmount) * 100, 100);
        const isOverLimit = percentage >= 100;
        
        return (
          <div key={budget.id} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">
                {budget.category.icon} {budget.category.name}
              </span>
              <span className={isOverLimit ? 'text-red-400' : 'text-gray-400'}>
                {formatMoney(budget.spentAmount)} / {formatMoney(budget.limitAmount)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverLimit 
                    ? 'bg-gradient-to-r from-red-500 to-red-400' 
                    : percentage > 80 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      : 'bg-gradient-to-r from-green-500 to-green-400'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
      {budgets.length > 3 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          + ещё {budgets.length - 3} бюджетов
        </p>
      )}
    </div>
  );
}