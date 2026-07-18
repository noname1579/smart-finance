'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import { formatMoney } from '@/app/lib/formatMoney';

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
  const [chartType, setChartType] = useState<'balance' | 'income' | 'expense'>('balance');

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-gray-500 text-sm">Недостаточно данных для графиков</p>
        <p className="text-gray-500 text-xs mt-1">Добавьте больше транзакций</p>
      </div>
    );
  }

  // Кастомный тултип
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass rounded-xl p-3 border border-white/10 shadow-xl">
          <p className="text-xs text-gray-400">{label}</p>
          {data.balance !== undefined && (
            <p className="text-sm font-semibold text-white">
              Баланс: {formatMoney(data.balance)}
            </p>
          )}
          {data.income !== undefined && data.income > 0 && (
            <p className="text-xs text-green-400">Доход: +{formatMoney(data.income)}</p>
          )}
          {data.expense !== undefined && data.expense > 0 && (
            <p className="text-xs text-red-400">Расход: -{formatMoney(data.expense)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Кастомный тултип для прогноза
  const ForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass rounded-xl p-3 border border-white/10 shadow-xl">
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-sm font-semibold text-orange-400">
            Прогноз: {formatMoney(data.amount)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Данные для графика
  const chartDataMap = {
    balance: {
      data: chartData,
      lines: [
        { key: 'balance', color: '#3b82f6', name: 'Баланс' },
      ],
      area: true,
    },
    income: {
      data: chartData,
      lines: [
        { key: 'income', color: '#22c55e', name: 'Доходы' },
      ],
      area: true,
    },
    expense: {
      data: chartData,
      lines: [
        { key: 'expense', color: '#ef4444', name: 'Расходы' },
      ],
      area: true,
    },
  };

  const currentChart = chartDataMap[chartType];

  return (
    <div className="space-y-6">
      {/* Сравнение с прошлым месяцем */}
      {monthComparison && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-gray-400">📈 Доходы</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-lg font-bold text-green-400">
                {formatMoney(monthComparison.current.income)}
              </p>
              <span className={`text-xs ${monthComparison.incomeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {monthComparison.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(monthComparison.incomeChange).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs {formatMoney(monthComparison.last.income)} в прошлом месяце</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-gray-400">📉 Расходы</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-lg font-bold text-red-400">
                {formatMoney(monthComparison.current.expense)}
              </p>
              <span className={`text-xs ${monthComparison.expenseChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {monthComparison.expenseChange <= 0 ? '↓' : '↑'} {Math.abs(monthComparison.expenseChange).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs {formatMoney(monthComparison.last.expense)} в прошлом месяце</p>
          </div>
        </div>
      )}

      {/* Выбор типа графика */}
      <div className="flex gap-2">
        <button
          onClick={() => setChartType('balance')}
          className={`px-3 py-1.5 rounded-xl text-xs transition ${
            chartType === 'balance'
              ? 'glass border border-blue-500/50 text-blue-400'
              : 'glass-light text-gray-400 hover:text-white'
          }`}
        >
          📊 Баланс
        </button>
        <button
          onClick={() => setChartType('income')}
          className={`px-3 py-1.5 rounded-xl text-xs transition ${
            chartType === 'income'
              ? 'glass border border-green-500/50 text-green-400'
              : 'glass-light text-gray-400 hover:text-white'
          }`}
        >
          📈 Доходы
        </button>
        <button
          onClick={() => setChartType('expense')}
          className={`px-3 py-1.5 rounded-xl text-xs transition ${
            chartType === 'expense'
              ? 'glass border border-red-500/50 text-red-400'
              : 'glass-light text-gray-400 hover:text-white'
          }`}
        >
          📉 Расходы
        </button>
      </div>

      {/* График */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentChart.data}>
            <defs>
              <linearGradient id={`gradient-${chartType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentChart.lines[0].color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={currentChart.lines[0].color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => {
                const d = new Date(value);
                return `${d.getDate()} ${d.toLocaleString('ru', { month: 'short' })}`;
              }}
              stroke="#4B5563"
              fontSize={10}
              interval={2}
            />
            <YAxis 
              stroke="#4B5563"
              fontSize={10}
              tickFormatter={(value) => `${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {currentChart.area && (
              <Area
                type="monotone"
                dataKey={currentChart.lines[0].key}
                stroke={currentChart.lines[0].color}
                fill={`url(#gradient-${chartType})`}
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Прогноз */}
      {forecast && forecast.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-300">🔮 Прогноз расходов</h3>
            <span className="text-xs text-gray-500">
              на {forecast.length} дней
            </span>
          </div>
          <div className="w-full h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return `${d.getDate()} ${d.toLocaleString('ru', { month: 'short' })}`;
                  }}
                  stroke="#4B5563"
                  fontSize={10}
                />
                <YAxis 
                  stroke="#4B5563"
                  fontSize={10}
                  tickFormatter={(value) => `${Math.round(value)}`}
                />
                <Tooltip content={<ForecastTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {monthComparison?.current?.expense > 0 && (
            <div className="flex justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
              <span>Средний расход в день: {formatMoney(monthComparison?.current?.expense / 30)}</span>
              <span>Прогноз на период: {formatMoney(forecast.reduce((sum, d) => sum + d.amount, 0))}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}