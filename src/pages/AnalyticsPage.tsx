import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BarChart } from '../components/charts/BarChart';
import { DonutChart } from '../components/charts/DonutChart';
import { LineChart } from '../components/charts/LineChart';

interface ServiceOrder {
  device_type: string;
  status: string;
  priority: string;
  final_cost: number | null;
  received_date: string;
  completed_date: string | null;
}

export function AnalyticsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const deviceTypeCounts = orders.reduce((acc, order) => {
    acc[order.device_type] = (acc[order.device_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceTypeLabels: Record<string, string> = {
    computer: 'Компьютеры',
    laptop: 'Ноутбуки',
    household_appliance: 'Бытовая техника',
    phone: 'Телефоны',
    other: 'Прочее',
  };

  const deviceTypeData = Object.entries(deviceTypeCounts).map(([type, count]) => ({
    label: deviceTypeLabels[type] || type,
    value: count,
  }));

  const priorityCounts = orders.reduce((acc, order) => {
    acc[order.priority] = (acc[order.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityColors: Record<string, string> = {
    low: '#6b7280',
    normal: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Низкий',
    normal: 'Обычный',
    high: 'Высокий',
    urgent: 'Срочный',
  };

  const priorityData = Object.entries(priorityCounts).map(([priority, count]) => ({
    label: priorityLabels[priority] || priority,
    value: count,
    color: priorityColors[priority] || '#6b7280',
  }));

  const revenueByDevice = orders
    .filter((order) => order.final_cost)
    .reduce((acc, order) => {
      acc[order.device_type] = (acc[order.device_type] || 0) + Number(order.final_cost);
      return acc;
    }, {} as Record<string, number>);

  const revenueData = Object.entries(revenueByDevice).map(([type, revenue]) => ({
    label: deviceTypeLabels[type] || type,
    value: Math.round(revenue),
  }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const ordersPerDay = last7Days.map((date) => {
    const count = orders.filter((order) => order.received_date.startsWith(date)).length;
    return {
      label: new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      value: count,
    };
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
        <p className="text-gray-600 mt-1">Подробный анализ данных о заказах</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Типы устройств</h3>
          <BarChart data={deviceTypeData} color="#3b82f6" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Приоритеты заказов</h3>
          <div className="flex justify-center">
            <DonutChart data={priorityData} size={240} centerLabel="Всего" centerValue={orders.length.toString()} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Выручка по типам устройств (₽)</h3>
          <BarChart data={revenueData} color="#10b981" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Заказы за последние 7 дней</h3>
          <LineChart data={ordersPerDay} height={220} color="#f59e0b" />
        </div>
      </div>
    </div>
  );
}
