'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type Transaction = {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
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
};

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

export default function CategoryPieChart({ transactions, categories }: Props) {
  // Группируем расходы по категориям
  const expenseTxs = transactions.filter(tx => {
    const cat = categories.find(c => c.id === tx.categoryId);
    return cat?.type === 'expense';
  });

  const grouped = expenseTxs.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
    return acc;
  }, {});

  // Фильтруем только категории с суммой > 0 и сортируем по убыванию
  const data = Object.entries(grouped)
    .filter(([_, total]) => total > 0) // ← Убираем нулевые значения
    .map(([catId, total]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || 'Без категории',
        value: Math.round(total * 100) / 100,
        color: cat?.color || '#8884d8',
        icon: cat?.icon || '❓',
      };
    })
    .sort((a, b) => b.value - a.value);

  // Если нет данных - показываем сообщение
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500">
        <span className="text-4xl mb-2">📊</span>
        <p className="text-sm">Нет расходов</p>
        <p className="text-xs text-gray-600 mt-1">Добавьте первую трату</p>
      </div>
    );
  }

  // Кастомный тултип
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass rounded-xl p-3 border border-white/10 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.icon}</span>
            <span className="text-sm font-medium text-white">{data.name}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {data.value.toFixed(2)} ₽
          </p>
          <p className="text-xs text-gray-400">
            {((data.value / data.total) * 100).toFixed(1)}% от всех расходов
          </p>
        </div>
      );
    }
    return null;
  };

  // Вычисляем общую сумму для процентов
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data.map(item => ({ ...item, total }))}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={2}
            label={({ name, percent }) => {
              const percentage = percent ? Math.round(percent * 100) : 0;
              return percentage > 5 ? `${percentage}%` : '';
            }}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="rgba(10, 10, 15, 0.8)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Легенда */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-300 truncate">{item.icon} {item.name}</span>
            <span className="text-gray-500 ml-auto">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}