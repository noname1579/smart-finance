import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Этот эндпоинт будет вызываться по расписанию (например, каждый день)
export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Находим все активные платежи, у которых nextDate === сегодня
    const payments = await prisma.recurringPayment.findMany({
      where: {
        isActive: true,
        nextDate: {
          lte: today,
        },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
      include: {
        user: true,
        category: true,
      },
    });

    let createdCount = 0;

    for (const payment of payments) {
      // Создаём транзакцию
      await prisma.transaction.create({
        data: {
          userId: payment.userId,
          categoryId: payment.categoryId,
          amount: payment.amount,
          description: `${payment.name} (регулярный платёж)`,
          date: today,
          isAuto: true,
        },
      });

      // Обновляем nextDate
      let nextDate = new Date(today);
      switch (payment.frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      await prisma.recurringPayment.update({
        where: { id: payment.id },
        data: { nextDate },
      });

      createdCount++;
    }

    return NextResponse.json({
      message: `Создано ${createdCount} транзакций`,
      createdCount,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Ошибка обработки регулярных платежей' },
      { status: 500 }
    );
  }
}