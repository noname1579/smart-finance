'use client';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0f]">
      {/* Анимированный фон */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Логотип с кристаллом */}
      <div className="relative z-10 text-center">
        <div className="relative w-24 h-24 mx-auto">
          {/* Кристалл */}
          <svg viewBox="0 0 200 200" className="w-full h-full animate-pulse-scale">
            <defs>
              <linearGradient id="diamond-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#60a5fa' }}/>
                <stop offset="50%" style={{ stopColor: '#a78bfa' }}/>
                <stop offset="100%" style={{ stopColor: '#f472b6' }}/>
              </linearGradient>
              <linearGradient id="diamond-inner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.6 }}/>
                <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }}/>
              </linearGradient>
            </defs>
            <rect x="10" y="10" width="180" height="180" rx="40" fill="#0a0a0f" stroke="url(#diamond-grad)" strokeWidth="2"/>
            <path d="M100 30 L140 80 L100 170 L60 80 Z" fill="url(#diamond-grad)" opacity="0.9"/>
            <path d="M100 30 L100 170 L140 80 Z" fill="url(#diamond-inner)"/>
            <path d="M100 30 L60 80 L100 170 Z" fill="url(#diamond-inner)" opacity="0.5"/>
            <circle cx="85" cy="65" r="2" fill="white" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="115" cy="75" r="1.5" fill="white" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="70" cy="95" r="1" fill="white" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <h1 className="text-3xl font-bold gradient-text mt-4">SmartFinance</h1>
        <p className="text-gray-400 text-sm mt-3 animate-pulse-text">Загрузка данных...</p>
      </div>

      {/* Точки загрузки */}
      <div className="relative z-10 mt-8 flex items-center gap-3">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-dot-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}