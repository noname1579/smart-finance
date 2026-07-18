type Transaction = {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  description?: string;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

// ⭐ Глобальная переменная для категорий (будет передаваться извне)
let globalCategories: Category[] = [];

/**
 * Устанавливает категории для использования в аналитике
 */
export function setCategoriesForAnalytics(categories: Category[]) {
  globalCategories = categories;
}

/**
 * Определяет тип транзакции (доход/расход) по категории
 */
function getTransactionType(tx: Transaction): 'income' | 'expense' {
  const category = globalCategories.find(c => c.id === tx.categoryId);
  return category?.type === 'income' ? 'income' : 'expense';
}

/**
 * Получает данные для графика баланса по дням
 */
export function getBalanceChartData(transactions: Transaction[], days: number = 30) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  
  // Создаём массив дней
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  
  // Группируем транзакции по дням
  const dailyIncome: Record<string, number> = {};
  const dailyExpense: Record<string, number> = {};
  
  transactions.forEach(tx => {
    const date = new Date(tx.date).toISOString().split('T')[0];
    const type = getTransactionType(tx);
    
    if (type === 'income') {
      dailyIncome[date] = (dailyIncome[date] || 0) + tx.amount;
    } else {
      dailyExpense[date] = (dailyExpense[date] || 0) + tx.amount;
    }
  });
  
  // Строим данные для графика
  let balance = 0;
  const chartData = dates.map(date => {
    const income = dailyIncome[date] || 0;
    const expense = dailyExpense[date] || 0;
    balance += income - expense;
    
    return {
      date,
      income,
      expense,
      balance,
      day: new Date(date).getDate(),
      month: new Date(date).toLocaleString('ru', { month: 'short' }),
    };
  });
  
  return chartData;
}

/**
 * Сравнение с прошлым месяцем
 */
export function getMonthComparison(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Текущий месяц
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
  
  // Прошлый месяц
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0);
  
  const calcMonthStats = (start: Date, end: Date) => {
    const txs = transactions.filter(tx => {
      const date = new Date(tx.date);
      return date >= start && date <= end;
    });
    
    const income = txs
      .filter(tx => getTransactionType(tx) === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expense = txs
      .filter(tx => getTransactionType(tx) === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const count = txs.length;
    
    return { income, expense, count };
  };
  
  const current = calcMonthStats(currentMonthStart, currentMonthEnd);
  const last = calcMonthStats(lastMonthStart, lastMonthEnd);
  
  // Процент изменения
  const incomeChange = last.income > 0 ? ((current.income - last.income) / last.income) * 100 : 0;
  const expenseChange = last.expense > 0 ? ((current.expense - last.expense) / last.expense) * 100 : 0;
  
  return {
    current,
    last,
    incomeChange,
    expenseChange,
    isHigher: expenseChange > 0,
  };
}

/**
 * Простой прогноз расходов на основе линейной регрессии
 */
export function getExpenseForecast(transactions: Transaction[], days: number = 7) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30);
  
  // Берём расходы за последние 30 дней
  const expenses = transactions
    .filter(tx => getTransactionType(tx) === 'expense')
    .filter(tx => new Date(tx.date) >= startDate)
    .map(tx => ({
      date: new Date(tx.date),
      amount: tx.amount,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  if (expenses.length < 3) {
    return {
      forecast: null,
      message: 'Недостаточно данных для прогноза (нужно минимум 3 транзакции)',
    };
  }
  
  // Группируем по дням
  const dailyTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const key = e.date.toISOString().split('T')[0];
    dailyTotals[key] = (dailyTotals[key] || 0) + e.amount;
  });
  
  const dataPoints = Object.entries(dailyTotals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, amount }));
  
  if (dataPoints.length < 3) {
    return {
      forecast: null,
      message: 'Недостаточно данных для прогноза',
    };
  }
  
  // Простая линейная регрессия
  const x = dataPoints.map((_, i) => i);
  const y = dataPoints.map(d => d.amount);
  const n = x.length;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Прогноз на следующие N дней
  const forecast = [];
  const lastIndex = dataPoints.length - 1;
  
  for (let i = 1; i <= days; i++) {
    const predicted = slope * (lastIndex + i) + intercept;
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + i);
    
    forecast.push({
      date: nextDate.toISOString().split('T')[0],
      amount: Math.max(0, predicted),
      day: nextDate.getDate(),
      month: nextDate.toLocaleString('ru', { month: 'short' }),
    });
  }
  
  const avgDaily = dataPoints.reduce((sum, d) => sum + d.amount, 0) / dataPoints.length;
  const totalForecast = forecast.reduce((sum, d) => sum + d.amount, 0);
  
  return {
    forecast,
    avgDaily,
    totalForecast,
    days: days,
    message: `Прогнозируемый расход на ${days} дней: ${Math.round(totalForecast)} ₽`,
  };
}