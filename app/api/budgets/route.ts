import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

// GET — получить все бюджеты пользователя
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const budgets = await prisma.budget.findMany({
    where: { 
      userId: session.user.id,
      isActive: true,
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(budgets);
}

// POST — создать бюджет
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { categoryId, limitAmount, period } = body;

    if (!categoryId || !limitAmount || !period) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    if (limitAmount <= 0) {
      return NextResponse.json(
        { error: 'Сумма лимита должна быть больше 0' },
        { status: 400 }
      );
    }

    // Проверяем, есть ли уже бюджет для этой категории
    const existing = await prisma.budget.findFirst({
      where: {
        userId: session.user.id,
        categoryId,
        period,
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Бюджет для этой категории уже существует' },
        { status: 409 }
      );
    }

    // Вычисляем даты начала и конца периода
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    }

    // Считаем уже потраченную сумму за период
    const spent = await prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        categoryId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const budget = await prisma.budget.create({
      data: {
        userId: session.user.id,
        categoryId,
        limitAmount,
        spentAmount: spent._sum.amount || 0,
        period,
        startDate,
        endDate,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Budget creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания бюджета' },
      { status: 500 }
    );
  }
}

// DELETE — удалить бюджет (soft delete)
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
        { error: 'ID бюджета обязателен' },
        { status: 400 }
      );
    }

    // Проверяем, что бюджет принадлежит пользователю
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Бюджет не найден' },
        { status: 404 }
      );
    }

    await prisma.budget.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Бюджет удалён' });
  } catch (error) {
    console.error('Budget deletion error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления бюджета' },
      { status: 500 }
    );
  }
}

// PUT — обновить бюджет
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, limitAmount } = body;

    if (!id || !limitAmount) {
      return NextResponse.json(
        { error: 'ID и сумма лимита обязательны' },
        { status: 400 }
      );
    }

    if (limitAmount <= 0) {
      return NextResponse.json(
        { error: 'Сумма лимита должна быть больше 0' },
        { status: 400 }
      );
    }

    // Проверяем, что бюджет принадлежит пользователю
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Бюджет не найден' },
        { status: 404 }
      );
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: { limitAmount },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Budget update error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления бюджета' },
      { status: 500 }
    );
  }
}