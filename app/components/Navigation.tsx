'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: '🏠', label: 'Главная' },
  { href: '/add', icon: '➕', label: 'Добавить' },
  { href: '/categories', icon: '📂', label: 'Категории' },
  { href: '/stats', icon: '📊', label: 'Статистика' },
];

export default function Navigation() {
  const pathname = usePathname();

  // Проверяем, находимся ли мы на страницах авторизации
  const isAuthPage = pathname?.startsWith('/auth/');

  // Если на странице авторизации - не показываем навигацию
  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 glass rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl sm:w-auto sm:min-w-[400px] sm:max-w-[600px] z-50">
      <div className="flex justify-around items-center py-2 px-4 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 sm:px-5 py-2 rounded-xl text-xs transition-all duration-200 hover:bg-white/5 ${
                isActive
                  ? 'text-white bg-white/10 shadow-lg shadow-white/5'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className={`text-lg sm:text-xl transition-transform duration-200 ${
                isActive ? 'scale-110' : ''
              }`}>
                {item.icon}
              </span>
              <span className={`font-medium text-[9px] sm:text-[11px] transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}