import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// ⭐ Добавляем GET для теста в браузере
export async function GET() {
  return await handleCron();
}

// POST для продакшена
export async function POST() {
  return await handleCron();
}

async function handleCron() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Находим все активные платежи, у которых nextDate <= сегодня
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

    console.log(`📅 Найдено ${payments.length} платежей для списания`);

    let createdCount = 0;

    for (const payment of payments) {
      // Проверяем, не создана ли уже транзакция сегодня
      const existing = await prisma.transaction.findFirst({
        where: {
          userId: payment.userId,
          description: `${payment.name} (регулярный платёж)`,
          date: {
            gte: today,
          },
        },
      });

      if (existing) {
        console.log(`⏭️ Платёж ${payment.name} уже списан сегодня`);
        continue;
      }

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
      console.log(`✅ Создана транзакция для ${payment.name}`);
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