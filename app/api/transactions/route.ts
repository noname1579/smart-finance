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

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        categoryId,
        amount: parseFloat(amount),
        description: description || '',
        date: new Date(date),
      },
      include: { category: true },
    });

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

    // Проверяем, что транзакция принадлежит пользователю
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Транзакция не найдена' },
        { status: 404 }
      );
    }

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