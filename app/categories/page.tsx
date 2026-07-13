'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoadingScreen from '../components/LoadingScreen';
import BackHomeButton from '../components/BackHomeButton';
import { useToast } from '../components/ToastProvider';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isSystem: boolean;
};

const POPULAR_ICONS = ['🍔', '🚗', '🏠', '🎮', '💰', '📦', '🛒', '☕', '🍕', '🎬', '✈️', '🏥', '📚', '🎵', '👕', '💄', '🔧', '🎁', '🏋️', '🧘'];

export default function CategoriesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📌',
    color: '#36A2EB',
    type: 'expense' as 'income' | 'expense'
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      console.log('📂 Загружено категорий:', data.length);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('❌ Ошибка загрузки категорий', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session) {
      fetchCategories();
    }
  }, [session, status]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      showToast('⚠️ Введите название категории', 'warning');
      return;
    }

    console.log('📝 Отправка запроса на создание:', newCategory);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      const data = await res.json();
      console.log('📝 Ответ сервера:', data);

      if (!res.ok) {
        showToast(data.error || 'Ошибка создания', 'error');
        return;
      }

      setCategories([...categories, data]);
      setNewCategory({
        name: '',
        icon: '📌',
        color: '#36A2EB',
        type: 'expense'
      });
      showToast('✅ Категория создана!', 'success');
    } catch (error) {
      console.error('❌ Ошибка:', error);
      showToast('❌ Ошибка создания категории', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Ошибка удаления', 'error');
        return;
      }

      setCategories(categories.filter(c => c.id !== id));
      showToast('🗑️ Категория удалена', 'success');
    } catch (error) {
      showToast('❌ Ошибка удаления', 'error');
    }
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditData({ ...cat });
  };

  const saveEditing = async () => {
    if (!editData) return;
    if (!editData.name.trim()) {
      showToast('⚠️ Введите название', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error('Ошибка обновления');

      setCategories(categories.map(c => 
        c.id === editingId ? editData : c
      ));
      setEditingId(null);
      setEditData(null);
      showToast('✅ Категория обновлена', 'success');
    } catch (error) {
      showToast('❌ Ошибка обновления', 'error');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData(null);
  };

  if (status === 'loading' || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold gradient-text">📂 Управление категориями</h1>
        <BackHomeButton />
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-300">📋 Все категории</h2>
          <button
            onClick={fetchCategories}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            🔄 Обновить
          </button>
        </div>
        
        <div className="space-y-2">
          {categories.map((cat) => {
            const isSystem = cat.isSystem;
            
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
          {categories.length} категорий • 🔒 Системные категории нельзя удалить
        </p>
      </div>
    </div>
  );
}