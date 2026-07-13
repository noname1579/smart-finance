'use client';

import Link from 'next/link';

type LogoProps = {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { logo: 28, text: 'text-lg' },
    md: { logo: 36, text: 'text-xl' },
    lg: { logo: 48, text: 'text-2xl' },
  };

  const currentSize = sizes[size];

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div 
        className="relative shrink-0"
        style={{ width: currentSize.logo, height: currentSize.logo }}
      >
        <img 
          src="/logo.svg" 
          alt="SmartFinance" 
          className="w-full h-full"
        />
      </div>
      {showText && (
        <span className={`font-bold ${currentSize.text} gradient-text`}>
          SmartFinance
        </span>
      )}
    </Link>
  );
}