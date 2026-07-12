import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Валидация
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Хэширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Создание системных категорий
    const categories = [
      { name: 'Еда', icon: '🍔', color: '#FF6384', type: 'expense', isSystem: true },
      { name: 'Транспорт', icon: '🚗', color: '#36A2EB', type: 'expense', isSystem: true },
      { name: 'Жильё', icon: '🏠', color: '#FFCE56', type: 'expense', isSystem: true },
      { name: 'Развлечения', icon: '🎮', color: '#4BC0C0', type: 'expense', isSystem: true },
      { name: 'Зарплата', icon: '💰', color: '#FF9F40', type: 'income', isSystem: true },
      { name: 'Прочее', icon: '📦', color: '#9966FF', type: 'expense', isSystem: true },
    ];

    await prisma.category.createMany({
      data: categories.map(cat => ({ ...cat, userId: user.id })),
    });

    return NextResponse.json(
      {
        message: 'Регистрация успешна!',
        user: { id: user.id, name: user.name, email: user.email }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}