import { LayoutDashboard, ClipboardList, Users, Settings, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { signOut, profile, isAdmin } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Панель KPI', icon: LayoutDashboard, adminOnly: false },
    { id: 'orders', label: 'Заказы', icon: ClipboardList, adminOnly: false },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3, adminOnly: false },
    { id: 'technicians', label: 'Сотрудники', icon: Users, adminOnly: true },
    { id: 'settings', label: 'Настройки', icon: Settings, adminOnly: true },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">Сервис всем</h1>
        <p className="text-sm text-slate-400 mt-1">KPI Dashboard</p>
      </div>

      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-semibold">
            {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || 'Пользователь'}</p>
            <p className="text-xs text-slate-400 truncate">
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
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выход</span>
        </button>
      </div>
    </div>
  );
}
