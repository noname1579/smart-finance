'use client';

import { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Plugin } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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

// ⭐ Плагин для текста в центре
const centerTextPlugin: Plugin<'pie'> = {
  id: 'centerText',
  beforeDraw: function(chart) {
    const { width, height, ctx } = chart;
    ctx.save();
    
    const total = (chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
    
    // Градиент для фона
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, 60
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.05)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Сумма с градиентом
    const textGradient = ctx.createLinearGradient(
      width / 2 - 40, height / 2 - 20,
      width / 2 + 40, height / 2 + 20
    );
    textGradient.addColorStop(0, '#60a5fa');
    textGradient.addColorStop(0.5, '#a78bfa');
    textGradient.addColorStop(1, '#f472b6');
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillStyle = textGradient;
    ctx.shadowColor = 'rgba(167, 139, 250, 0.3)';
    ctx.shadowBlur = 20;
    ctx.fillText(`${total} ₽`, width / 2, height / 2 - 10);
    
    // Подпись
    ctx.shadowBlur = 0;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Всего расходов', width / 2, height / 2 + 24);
    
    ctx.restore();
  }
};

export default function CategoryPieChart({ transactions, categories }: Props) {
  const [chartData, setChartData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (transactions && transactions.length > 0 && categories && categories.length > 0) {
      const expenseTxs = transactions.filter(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        return cat?.type === 'expense' && tx.amount > 0;
      });

      if (expenseTxs.length > 0) {
        const grouped = expenseTxs.reduce<Record<string, number>>((acc, tx) => {
          acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
          return acc;
        }, {});

        const labels: string[] = [];
        const values: number[] = [];
        const colors: string[] = [];
        const icons: string[] = [];

        Object.entries(grouped)
          .filter(([_, total]) => total > 0)
          .sort((a, b) => b[1] - a[1])
          .forEach(([catId, total]) => {
            const cat = categories.find(c => c.id === catId);
            labels.push(cat?.name || 'Без категории');
            values.push(total);
            colors.push(cat?.color || '#8884d8');
            icons.push(cat?.icon || '📌');
          });

        if (labels.length > 0) {
          setChartData({
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: colors.map(c => c + 'CC'),
                borderColor: colors,
                borderWidth: 3,
                hoverOffset: 20,
                hoverBorderWidth: 4,
              },
            ],
            icons,
          });
          return;
        }
      }
    }

    // Тестовые данные
    setChartData({
      labels: ['Еда', 'Транспорт', 'Жильё'],
      datasets: [
        {
          data: [400, 300, 200],
          backgroundColor: ['#FF6384CC', '#36A2EBCC', '#FFCE56CC'],
          borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          borderWidth: 3,
          hoverOffset: 20,
          hoverBorderWidth: 4,
        },
      ],
      icons: ['🍔', '🚗', '🏠'],
    });
  }, [transactions, categories]);

  if (!isClient || !chartData) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 animate-pulse">Загрузка графика...</p>
        </div>
      </div>
    );
  }

  const hasData = chartData.datasets[0].data.some((v: number) => v > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <div className="text-5xl mb-3 opacity-50">📊</div>
        <p className="text-sm text-gray-500">Нет расходов</p>
        <p className="text-xs text-gray-600 mt-1">Добавьте первую трату</p>
      </div>
    );
  }

  const total = chartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);

  // ⭐ Кастомный тултип — исправлен тип weight
  const customTooltip = {
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    titleColor: '#ffffff',
    bodyColor: '#d1d5db',
    titleFont: { 
      size: 13, 
      weight: 'bold' as const, // ← исправлено
      family: 'Inter' 
    },
    bodyFont: { 
      size: 12, 
      family: 'Inter' 
    },
    callbacks: {
      label: function(context: any) {
        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
        const icon = chartData.icons?.[context.dataIndex] || '';
        return `${icon} ${context.label}: ${context.parsed} ₽ (${percentage}%)`;
      }
    }
  };

  // ⭐ Данные для сводки
  const summaryData = chartData.labels.map((label: string, index: number) => ({
    label,
    value: chartData.datasets[0].data[index],
    color: chartData.datasets[0].backgroundColor[index],
    borderColor: chartData.datasets[0].borderColor[index],
    icon: chartData.icons?.[index] || '📌',
    percentage: total > 0 ? ((chartData.datasets[0].data[index] / total) * 100).toFixed(0) : 0,
  })).sort((a: any, b: any) => b.value - a.value);

  return (
    <div className="w-full space-y-6">
      {/* График */}
      <div className="relative">
        <div 
          className="relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent p-4 border border-white/5"
          style={{ 
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ height: '340px', position: 'relative' }}>
            <Pie
              ref={chartRef}
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: customTooltip,
                },
                animation: {
                  animateRotate: true,
                  duration: 1200,
                  easing: 'easeInOutQuart',
                },
              }}
              plugins={[centerTextPlugin]}
            />
          </div>
        </div>
        
        {/* Медиа-запрос для скрытия текста в центре на мобильных */}
        <style>{`
          @media (max-width: 640px) {
            canvas + div {
              display: none !important;
            }
          }
        `}</style>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {summaryData.slice(0, 6).map((item: any, index: number) => {
          const maxValue = summaryData[0]?.value || 1;
          const barWidth = (item.value / maxValue) * 100;
          
          return (
            <div 
              key={index}
              className="group relative glass-light rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5"
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 transition-transform group-hover:scale-110"
                  style={{ 
                    background: `${item.borderColor}20`,
                    border: `1px solid ${item.borderColor}30`,
                  }}
                >
                  {item.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[11px] font-medium text-gray-300 truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-bold text-white shrink-0">
                      {item.percentage}%
                    </span>
                  </div>
                  
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.max(barWidth, 2)}%`,
                        background: `linear-gradient(90deg, ${item.borderColor}, ${item.borderColor}aa)`,
                        boxShadow: `0 0 10px ${item.borderColor}40`,
                      }}
                    />
                  </div>
                  
                  <span className="text-[9px] text-gray-500 mt-0.5 block">
                    {item.value.toFixed(0)} ₽
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Информация о сумме */}
      <div className="text-center">
        <p className="text-[10px] text-gray-500">
          Всего расходов: <span className="text-gray-300 font-medium">{total.toFixed(0)} ₽</span>
          {' • '}
          <span className="text-gray-500">{summaryData.length} категорий</span>
        </p>
      </div>
    </div>
  );
}