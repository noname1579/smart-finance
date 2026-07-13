'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import LoadingScreen from '@/app/components/LoadingScreen';
import Logo from '@/app/components/Logo';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('⚠️ Заполните все поля');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('⚠️ Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('⚠️ Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка регистрации');
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Ошибка входа после регистрации');
        setIsLoading(false);
        return;
      }

      router.push('/');
    } catch (error) {
      setError('Произошла ошибка. Попробуйте позже.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-[#0a0a0f] overflow-hidden touch-none select-none">
      <div className="w-full max-w-md glass rounded-2xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <Logo size="lg" showText={false} className="justify-center" />
          <h1 className="text-3xl font-bold gradient-text mt-2">SmartFinance</h1>
          <p className="text-gray-400 text-sm mt-2">Создайте аккаунт и начните управлять финансами</p>
        </div>

        {error && (
          <div className="glass rounded-xl p-3 border border-red-500/30 bg-red-500/10 mb-4 relative z-10">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              👤 Имя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full glass rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition duration-200"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full glass rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition duration-200"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              🔒 Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full glass rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition duration-200 pr-10"
                required
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              🔒 Подтвердите пароль
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              className="w-full glass rounded-xl border border-white/10 p-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition duration-200"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-medium text-base hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Создание...' : 'Создать аккаунт'}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <p className="text-sm text-gray-400">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition font-medium hover:underline">
              Войти
            </Link>
          </p>
          <p className="text-xs text-gray-500 mt-4">
            💡 Все данные хранятся в защищённой базе данных
          </p>
        </div>
      </div>
    </div>
  );
}