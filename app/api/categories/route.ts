import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

// GET — получить все категории пользователя
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  console.log('📂 GET /api/categories — найдено:', categories.length);
  return NextResponse.json(categories);
}

// POST — создать категорию
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('📝 POST /api/categories — тело запроса:', body);
    
    const { name, icon, color, type } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Название и тип обязательны' },
        { status: 400 }
      );
    }

    // Проверяем, нет ли уже такой категории у пользователя
    const existing = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Категория с таким названием уже существует' },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        userId: session.user.id,
        name,
        icon: icon || '📌',
        color: color || '#8884d8',
        type,
        isSystem: false,
      },
    });

    console.log('✅ Категория создана:', category);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('❌ Ошибка создания категории:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE — удалить категорию
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
        { error: 'ID категории обязателен' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    const transactions = await prisma.transaction.findFirst({
      where: { categoryId: id },
    });

    if (transactions) {
      return NextResponse.json(
        { error: 'Категория используется в транзакциях' },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('❌ Ошибка удаления категории:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления категории' },
      { status: 500 }
    );
  }
}

// PUT — обновить категорию
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, icon, color, type } = body;

    if (!id || !name || !type) {
      return NextResponse.json(
        { error: 'ID, название и тип обязательны' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        icon: icon || '📌',
        color: color || '#8884d8',
        type,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('❌ Ошибка обновления категории:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления категории' },
      { status: 500 }
    );
  }
}