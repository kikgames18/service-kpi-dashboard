import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardPage } from '../pages/DashboardPage';
import { OrdersPage } from '../pages/OrdersPage';
import { TechniciansPage } from '../pages/TechniciansPage';
import { HelpPage } from '../pages/HelpPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { BackupPage } from '../pages/BackupPage';

export function Dashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'orders':
        return <OrdersPage />;
      case 'technicians':
        return <TechniciansPage />;
      case 'help':
        return <HelpPage />;
      case 'profile':
        return <ProfilePage />;
      case 'audit':
        return <AuditLogPage />;
      case 'backup':
        return <BackupPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
