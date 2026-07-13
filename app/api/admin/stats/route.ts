import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  
  return user?.role === 'admin';
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [users, transactions, categories, budgets] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.category.count(),
    prisma.budget.count(),
  ]);

  const totalAmount = await prisma.transaction.aggregate({
    _sum: { amount: true },
  });

  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      category: { select: { name: true, icon: true, type: true } },
    },
  });

  return NextResponse.json({
    users,
    transactions,
    categories,
    budgets,
    totalAmount: totalAmount._sum.amount || 0,
    recentTransactions,
  });
}