'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFromStorage, setToStorage } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

const defaultCategories: Category[] = [
  { id: 'food', name: 'Еда', icon: '🍔', color: '#FF6384', type: 'expense' },
  { id: 'transport', name: 'Транспорт', icon: '🚗', color: '#36A2EB', type: 'expense' },
  { id: 'housing', name: 'Жильё', icon: '🏠', color: '#FFCE56', type: 'expense' },
  { id: 'entertainment', name: 'Развлечения', icon: '🎮', color: '#4BC0C0', type: 'expense' },
  { id: 'salary', name: 'Зарплата', icon: '💰', color: '#FF9F40', type: 'income' },
  { id: 'other', name: 'Прочее', icon: '📦', color: '#9966FF', type: 'expense' },
];

const POPULAR_ICONS = ['🍔', '🚗', '🏠', '🎮', '💰', '📦', '🛒', '☕', '🍕', '🎬', '✈️', '🏥', '📚', '🎵', '👕', '💄', '🔧', '🎁', '🏋️', '🧘'];

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📌',
    color: '#36A2EB',
    type: 'expense' as 'income' | 'expense'
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Category | null>(null);

  useEffect(() => {
    const saved = getFromStorage<Category[]>('categories', defaultCategories);
    setCategories(saved);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setToStorage('categories', categories);
    }
  }, [categories, isLoading]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      alert('Введите название категории');
      return;
    }

    const exists = categories.some(c => 
      c.name.toLowerCase() === newCategory.name.trim().toLowerCase()
    );
    if (exists) {
      alert('Категория с таким названием уже существует');
      return;
    }

    const newCat: Category = {
      id: uuidv4(),
      name: newCategory.name.trim(),
      icon: newCategory.icon,
      color: newCategory.color,
      type: newCategory.type,
    };

    setCategories([...categories, newCat]);
    setNewCategory({
      name: '',
      icon: '📌',
      color: '#36A2EB',
      type: 'expense'
    });
  };

  const handleDeleteCategory = (id: string) => {
    const transactions = getFromStorage<any[]>('transactions', []);
    const isUsed = transactions.some(tx => tx.categoryId === id);
    
    if (isUsed) {
      if (!confirm('❌ Эта категория используется в транзакциях. Удалить нельзя, так как это нарушит целостность данных.')) {
        return;
      }
    }
    
    if (confirm(`Удалить категорию "${categories.find(c => c.id === id)?.name}"?`)) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditData({ ...cat });
  };

  const saveEditing = () => {
    if (!editData) return;
    if (!editData.name.trim()) {
      alert('Введите название категории');
      return;
    }

    setCategories(categories.map(c => 
      c.id === editingId ? editData : c
    ));
    setEditingId(null);
    setEditData(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3 pt-4">
        <button 
          onClick={() => router.back()}
          className="glass rounded-full p-2 hover:bg-white/5 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold gradient-text">
          📂 Управление категориями
        </h1>
      </div>

      {/* Форма добавления */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">➕ Новая категория</h2>
        
        <form onSubmit={handleAddCategory} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Название</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Название категории"
                className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Тип</label>
              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'income' | 'expense' })}
                className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white bg-transparent focus:outline-none focus:border-blue-500/50 transition"
              >
                <option value="expense" className="bg-[#0a0a0f]">📉 Расход</option>
                <option value="income" className="bg-[#0a0a0f]">📈 Доход</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Иконка</label>
              <input
                type="text"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                placeholder="🍔"
                className="glass w-full rounded-xl border border-white/10 p-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Цвет</label>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-full h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Популярные иконки</label>
            <div className="flex flex-wrap gap-1">
              {POPULAR_ICONS.slice(0, 12).map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewCategory({ ...newCategory, icon })}
                  className={`p-1.5 rounded-lg transition hover:bg-white/10 ${
                    newCategory.icon === icon ? 'glass border border-blue-500/50' : ''
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            ➕ Добавить категорию
          </button>
        </form>
      </div>

      {/* Список категорий */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">📋 Все категории</h2>
        
        <div className="space-y-2">
          {categories.map(cat => {
            const isSystem = ['food', 'transport', 'housing', 'entertainment', 'salary', 'other'].includes(cat.id);
            
            return (
              <div 
                key={cat.id}
                className="flex items-center gap-3 p-3 rounded-xl glass-light border border-white/5 hover:border-white/10 transition group"
              >
                {editingId === cat.id && editData ? (
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editData.icon}
                      onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                      className="w-10 glass rounded-lg p-1 text-center text-sm"
                      maxLength={2}
                    />
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="flex-1 min-w-[100px] glass rounded-lg p-1.5 text-sm text-white bg-transparent focus:outline-none focus:border-blue-500/50"
                    />
                    <input
                      type="color"
                      value={editData.color}
                      onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={saveEditing}
                      className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                    >
                      ✅
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                    >
                      ❌
                    </button>
                  </div>
                ) : (
                  <>
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}30` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white truncate">
                          {cat.name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          cat.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {cat.type === 'income' ? 'Доход' : 'Расход'}
                        </span>
                        {isSystem && (
                          <span className="text-xs text-gray-500">🔒</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(cat)}
                        className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition"
                      >
                        ✏️
                      </button>
                      {!isSystem && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          💡 Системные категории (🔒) нельзя удалить
        </p>
      </div>
    </div>
  );
}