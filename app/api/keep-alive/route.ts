import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    // Простой запрос к БД, чтобы она не засыпала
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', message: 'Database is awake' });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 });
  }
}