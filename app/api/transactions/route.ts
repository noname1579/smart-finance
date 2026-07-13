import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

// GET — получить все транзакции пользователя
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(transactions);
}

// POST — создать транзакцию
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, categoryId, description, date } = body;

    if (!amount || !categoryId) {
      return NextResponse.json(
        { error: 'Сумма и категория обязательны' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    const transactionDate = new Date(date);

    // Создаём транзакцию
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        categoryId,
        amount: numAmount,
        description: description || '',
        date: transactionDate,
      },
      include: { category: true },
    });

    // ⭐ ОБНОВЛЯЕМ SPENTAMOUNT В БЮДЖЕТАХ
    // Находим активный бюджет для этой категории (ТОЛЬКО если categoryId не null)
    if (categoryId) {
      const activeBudget = await prisma.budget.findFirst({
        where: {
          userId: session.user.id,
          categoryId: categoryId, // ← теперь точно string
          isActive: true,
          startDate: { lte: transactionDate },
          endDate: { gte: transactionDate },
        },
      });

      if (activeBudget) {
        await prisma.budget.update({
          where: { id: activeBudget.id },
          data: {
            spentAmount: {
              increment: numAmount,
            },
          },
        });
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания транзакции' },
      { status: 500 }
    );
  }
}

// DELETE — удалить транзакцию
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID транзакции обязателен' },
        { status: 400 }
      );
    }

    // Находим транзакцию
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Транзакция не найдена' },
        { status: 404 }
      );
    }

    // ⭐ УМЕНЬШАЕМ SPENTAMOUNT В БЮДЖЕТЕ (ТОЛЬКО если categoryId не null)
    if (transaction.categoryId) {
      const activeBudget = await prisma.budget.findFirst({
        where: {
          userId: session.user.id,
          categoryId: transaction.categoryId, // ← теперь точно string
          isActive: true,
          startDate: { lte: transaction.date },
          endDate: { gte: transaction.date },
        },
      });

      if (activeBudget) {
        await prisma.budget.update({
          where: { id: activeBudget.id },
          data: {
            spentAmount: {
              decrement: transaction.amount,
            },
          },
        });
      }
    }

    // Удаляем транзакцию
    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ message: 'Транзакция удалена' });
  } catch (error) {
    console.error('Transaction deletion error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления транзакции' },
      { status: 500 }
    );
  }
}

// PUT — обновить транзакцию
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, amount, categoryId, description, date } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID транзакции обязателен' },
        { status: 400 }
      );
    }

    // Находим старую транзакцию
    const oldTransaction = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!oldTransaction) {
      return NextResponse.json(
        { error: 'Транзакция не найдена' },
        { status: 404 }
      );
    }

    const numAmount = parseFloat(amount);
    const transactionDate = new Date(date);

    // Обновляем транзакцию
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount: numAmount,
        categoryId,
        description: description || '',
        date: transactionDate,
      },
      include: { category: true },
    });

    // ⭐ ПЕРЕСЧИТЫВАЕМ SPENTAMOUNT ДЛЯ СТАРОЙ И НОВОЙ КАТЕГОРИИ

    // 1. Уменьшаем для старой категории (если она была)
    if (oldTransaction.categoryId) {
      const oldBudget = await prisma.budget.findFirst({
        where: {
          userId: session.user.id,
          categoryId: oldTransaction.categoryId, // ← теперь точно string
          isActive: true,
          startDate: { lte: oldTransaction.date },
          endDate: { gte: oldTransaction.date },
        },
      });

      if (oldBudget) {
        await prisma.budget.update({
          where: { id: oldBudget.id },
          data: {
            spentAmount: {
              decrement: oldTransaction.amount,
            },
          },
        });
      }
    }

    // 2. Увеличиваем для новой категории (если она есть)
    if (categoryId) {
      const newBudget = await prisma.budget.findFirst({
        where: {
          userId: session.user.id,
          categoryId: categoryId, // ← теперь точно string
          isActive: true,
          startDate: { lte: transactionDate },
          endDate: { gte: transactionDate },
        },
      });

      if (newBudget) {
        await prisma.budget.update({
          where: { id: newBudget.id },
          data: {
            spentAmount: {
              increment: numAmount,
            },
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления транзакции' },
      { status: 500 }
    );
  }
}