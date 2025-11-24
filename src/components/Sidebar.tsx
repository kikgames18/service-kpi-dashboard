import { LayoutDashboard, ClipboardList, Users, Book, LogOut, BarChart3, Moon, Sun, User, History, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { signOut, profile, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд KPI', icon: LayoutDashboard, adminOnly: false },
    { id: 'orders', label: 'Заказы', icon: ClipboardList, adminOnly: false },
    { id: 'technicians', label: 'Сотрудники', icon: Users, adminOnly: true },
    { id: 'audit', label: 'История изменений', icon: History, adminOnly: true },
    { id: 'backup', label: 'Резервное копирование', icon: Database, adminOnly: true },
    { id: 'profile', label: 'Профиль', icon: User, adminOnly: false },
    { id: 'help', label: 'Справочный раздел', icon: Book, adminOnly: false },
  ];

  return (
    <div className={`w-72 flex flex-col h-screen ${
      theme === 'dark' 
        ? 'bg-slate-900 text-white' 
        : 'bg-white text-gray-900 border-r border-gray-200'
    }`}>
      <div className={`p-6 border-b ${
        theme === 'dark' ? 'border-slate-800' : 'border-gray-200'
      }`}>
        <h1 className="text-xl font-bold">Веб-дашборд</h1>
        <p className={`text-sm mt-1 ${
          theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
        }`}>
          ООО "Сервис Всем"
        </p>
      </div>

      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-slate-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
          }`}>
            {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || 'Пользователь'}</p>
            <p className={`text-xs truncate ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {isAdmin ? 'Администратор' : 'Пользователь'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
      </nav>

      <div className={`p-4 border-t space-y-2 ${
        theme === 'dark' ? 'border-slate-800' : 'border-gray-200'
      }`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5" />
              <span className="font-medium">Светлая тема</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              <span className="font-medium">Темная тема</span>
            </>
          )}
        </button>
        <button
          onClick={signOut}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выход</span>
        </button>
      </div>
    </div>
  );
}
