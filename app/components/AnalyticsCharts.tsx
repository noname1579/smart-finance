'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Chart } from 'react-chartjs-2';
import { formatMoney } from '@/app/lib/formatMoney';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type ChartData = {
  date: string;
  income: number;
  expense: number;
  balance: number;
  day: number;
  month: string;
};

type Forecast = {
  date: string;
  amount: number;
  day: number;
  month: string;
};

type Props = {
  chartData: ChartData[];
  forecast: Forecast[] | null;
  monthComparison: any;
};

export default function AnalyticsCharts({ chartData, forecast, monthComparison }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Загрузка графиков...</p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-gray-500 text-sm">Недостаточно данных для графиков</p>
        <p className="text-gray-500 text-xs mt-1">Добавьте больше транзакций</p>
      </div>
    );
  }

  // ⭐ Сравнение с прошлым месяцем
  const comparison = monthComparison || {};

  // ⭐ Данные для графика баланса
  const balanceLabels = chartData.map(d => `${d.day} ${d.month}`);
  const balanceData = chartData.map(d => d.balance);
  const incomeData = chartData.map(d => d.income);
  const expenseData = chartData.map(d => d.expense);

  // ⭐ Данные для прогноза
  const forecastLabels = forecast?.map(d => `${d.day} ${d.month}`) || [];
  const forecastData = forecast?.map(d => d.amount) || [];

  // ⭐ График баланса
  const balanceChartData = {
    labels: balanceLabels,
    datasets: [
      {
        label: 'Баланс',
        data: balanceData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
      },
    ],
  };

  // ⭐ График доходов/расходов
  const incomeExpenseData = {
    labels: balanceLabels,
    datasets: [
      {
        label: 'Доходы',
        data: incomeData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
      },
      {
        label: 'Расходы',
        data: expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
      },
    ],
  };

  // ⭐ Прогноз
  const forecastChartData = {
    labels: forecastLabels,
    datasets: [
      {
        label: 'Прогноз расходов',
        data: forecastData,
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: '#f59e0b',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9ca3af',
          font: { size: 11, family: 'Inter' },
          boxWidth: 12,
          boxHeight: 12,
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${formatMoney(context.parsed.y)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255,255,255,0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: { size: 9 },
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: 'rgba(255,255,255,0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: { size: 9 },
          callback: function(value: any) {
            return formatMoney(value);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        display: false,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Сравнение с прошлым месяцем */}
      {comparison.current && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-gray-400">📈 Доходы</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-lg font-bold text-green-400">
                {formatMoney(comparison.current?.income || 0)}
              </p>
              <span className={`text-xs ${comparison.incomeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {comparison.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(comparison.incomeChange || 0).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs {formatMoney(comparison.last?.income || 0)} в прошлом месяце
            </p>
          </div>
          <div className="glass rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-gray-400">📉 Расходы</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-lg font-bold text-red-400">
                {formatMoney(comparison.current?.expense || 0)}
              </p>
              <span className={`text-xs ${comparison.expenseChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {comparison.expenseChange <= 0 ? '↓' : '↑'} {Math.abs(comparison.expenseChange || 0).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs {formatMoney(comparison.last?.expense || 0)} в прошлом месяце
            </p>
          </div>
        </div>
      )}

      {/* График баланса */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📊 Баланс</h3>
        <div style={{ height: '200px' }}>
          <Line
            data={balanceChartData}
            options={chartOptions}
          />
        </div>
      </div>

      {/* График доходов/расходов */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📈 Доходы и расходы</h3>
        <div style={{ height: '200px' }}>
          <Line
            data={incomeExpenseData}
            options={chartOptions}
          />
        </div>
      </div>

      {/* Прогноз */}
      {forecast && forecast.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-300">🔮 Прогноз расходов</h3>
            <span className="text-xs text-gray-500">
              на {forecast.length} дней
            </span>
          </div>
          <div style={{ height: '160px' }}>
            <Bar
              data={forecastChartData}
              options={barOptions}
            />
          </div>
          {comparison?.current?.expense > 0 && (
            <div className="flex justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
              <span>Средний расход в день: {formatMoney(comparison.current?.expense / 30 || 0)}</span>
              <span>Прогноз на период: {formatMoney(forecast.reduce((sum, d) => sum + d.amount, 0))}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}