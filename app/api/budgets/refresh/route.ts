import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Находим все активные бюджеты пользователя
    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    let updatedCount = 0;

    for (const budget of budgets) {
      // Считаем потраченную сумму за период
      const spent = await prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          categoryId: budget.categoryId,
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const spentAmount = spent._sum.amount || 0;

      // Обновляем бюджет
      await prisma.budget.update({
        where: { id: budget.id },
        data: { spentAmount },
      });

      updatedCount++;
    }

    return NextResponse.json({
      message: `Обновлено ${updatedCount} бюджетов`,
      updatedCount,
    });
  } catch (error) {
    console.error('Refresh budgets error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления бюджетов' },
      { status: 500 }
    );
  }
}