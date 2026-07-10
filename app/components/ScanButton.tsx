'use client';

import { useRef, useState } from 'react';

export default function ScanButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsScanning(true);
      console.log('📸 Выбран файл для сканирования:', file.name);
      
      setTimeout(() => {
        setIsScanning(false);
        alert('✅ Чек отсканирован! (заглушка)');
      }, 1500);
    }
  };

  return (
    <>
      <button
        onClick={handleScan}
        disabled={isScanning}
        className={`relative bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3.5 rounded-full shadow-2xl transition-all hover:scale-110 shadow-purple-500/20 ${
          isScanning ? 'animate-pulse opacity-50' : 'hover:shadow-purple-500/30'
        }`}
        title="Сканировать чек"
      >
        {isScanning ? (
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}