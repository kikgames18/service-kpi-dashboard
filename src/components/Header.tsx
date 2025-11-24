import { useState } from 'react';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, X } from 'lucide-react';

export function Header() {
  const { profile } = useAuth();
  const [isHidden, setIsHidden] = useState(() => {
    // Проверяем localStorage при инициализации
    return localStorage.getItem('headerHidden') === 'true';
  });

  const handleHide = () => {
    setIsHidden(true);
    localStorage.setItem('headerHidden', 'true');
  };

  const handleShow = () => {
    setIsHidden(false);
    localStorage.removeItem('headerHidden');
  };

  if (isHidden) {
    return (
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 py-2">
        <div className="flex items-center justify-end">
          <button
            onClick={handleShow}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Показать заголовок"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
            Добро пожаловать, {profile?.full_name || 'Пользователь'}!
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={handleHide}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Закрыть заголовок"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
