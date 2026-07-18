import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

// GET — получить все регулярные платежи пользователя
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payments = await prisma.recurringPayment.findMany({
    where: { 
      userId: session.user.id,
      isActive: true,
    },
    include: {
      category: true,
    },
    orderBy: { nextDate: 'asc' },
  });

  return NextResponse.json(payments);
}

// POST — создать регулярный платёж
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, amount, categoryId, frequency, startDate, endDate, description } = body;

    if (!name || !amount || !categoryId || !frequency || !startDate) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть больше 0' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    let nextDate = new Date(start);

    // Вычисляем следующую дату
    switch (frequency) {
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

    const payment = await prisma.recurringPayment.create({
      data: {
        userId: session.user.id,
        name,
        amount,
        categoryId,
        frequency,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextDate,
        description: description || '',
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Recurring payment creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания регулярного платежа' },
      { status: 500 }
    );
  }
}

// DELETE — удалить регулярный платёж (soft delete)
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
        { error: 'ID обязателен' },
        { status: 400 }
      );
    }

    const payment = await prisma.recurringPayment.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Платёж не найден' },
        { status: 404 }
      );
    }

    await prisma.recurringPayment.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Регулярный платёж удалён' });
  } catch (error) {
    console.error('Recurring payment deletion error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления' },
      { status: 500 }
    );
  }
}