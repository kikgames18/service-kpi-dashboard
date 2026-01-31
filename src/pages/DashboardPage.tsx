import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { MetricCard } from '../components/MetricCard';
import { DonutChart } from '../components/charts/DonutChart';
import { LineChart } from '../components/charts/LineChart';
import { PieChart } from '../components/charts/PieChart';
import { BarChart } from '../components/charts/BarChart';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { TrendingUp, CheckCircle, XCircle, DollarSign, Clock, Calendar } from 'lucide-react';

interface ServiceOrder {
  id: string;
  status: string;
  priority: string;
  device_type: string;
  received_date: string;
  completed_date: string | null;
  final_cost: number | null;
  estimated_cost: number | null;
  issue_description: string;
  assigned_to: string | null;
}

interface Technician {
  id: string;
  full_name: string;
}

interface KPIMetric {
  metric_date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  revenue: number;
  avg_completion_time_hours: number;
  customer_satisfaction: number;
}

type PeriodType = '7' | '30' | '90' | '365';

export function DashboardPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('7');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersData, techniciansData] = await Promise.all([
        api.getOrders(),
        api.getTechnicians(),
      ]);
      setOrders(ordersData || []);
      setTechnicians(techniciansData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Перезагружаем данные при изменении периода
  useEffect(() => {
    // Данные уже загружены, просто пересчитываем метрики
  }, [period, orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Фильтруем заказы по периоду
  const getFilteredOrders = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const daysAgo = new Date();
    daysAgo.setHours(0, 0, 0, 0);
    
    switch (period) {
      case '7': daysAgo.setDate(now.getDate() - 7); break;
      case '30': daysAgo.setDate(now.getDate() - 30); break;
      case '90': daysAgo.setDate(now.getDate() - 90); break;
      case '365': daysAgo.setDate(now.getDate() - 365); break;
    }
    
    return orders.filter(order => {
      const orderDate = new Date(order.received_date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate >= daysAgo && orderDate <= now;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Рассчитываем актуальные метрики на основе ВСЕХ заказов (не только за период)
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.final_cost || o.estimated_cost || 0), 0);

  // Среднее время выполнения
  const completedWithDate = orders.filter(o => 
    o.status === 'completed' && o.completed_date && o.received_date
  );
  const avgCompletionTime = completedWithDate.length > 0
    ? completedWithDate.reduce((sum, o) => {
        const start = new Date(o.received_date);
        const end = new Date(o.completed_date!);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / completedWithDate.length
    : 0;

  // Распределение по статусам (DonutChart) - используем ВСЕ заказы для диаграммы
  const allCompletedOrders = orders.filter(o => o.status === 'completed').length;
  const allInProgressOrders = orders.filter(o => o.status === 'in_progress').length;
  const allPendingOrders = orders.filter(o => o.status === 'pending').length;
  const allCancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const allTotalOrders = orders.length;

  const orderStatusData = [
    { label: 'Завершено', value: allCompletedOrders, color: '#10b981' },
    { label: 'В работе', value: allInProgressOrders, color: '#3b82f6' },
    { label: 'Ожидает', value: allPendingOrders, color: '#f59e0b' },
    { label: 'Отменено', value: allCancelledOrders, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Распределение по типам устройств (PieChart) - используем ВСЕ заказы
  const deviceTypeCounts: Record<string, number> = {};
  orders.forEach(order => {
    const type = order.device_type || 'other';
    deviceTypeCounts[type] = (deviceTypeCounts[type] || 0) + 1;
  });

  const deviceTypeLabels: Record<string, string> = {
    computer: 'Компьютер',
    laptop: 'Ноутбук',
    household_appliance: 'Бытовая техника',
    phone: 'Телефон',
    other: 'Прочее',
  };

  const deviceTypeData = Object.entries(deviceTypeCounts)
    .map(([type, count]) => ({
      label: deviceTypeLabels[type] || type,
      value: count,
      color: type === 'computer' ? '#3b82f6' : 
             type === 'laptop' ? '#10b981' : 
             type === 'household_appliance' ? '#f59e0b' : 
             type === 'phone' ? '#ef4444' : '#8b5cf6',
    }))
    .filter(item => item.value > 0);

  // Динамика заказов по дням (LineChart)
  const ordersByDate: Record<string, number> = {};
  filteredOrders.forEach(order => {
    const date = new Date(order.received_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    ordersByDate[date] = (ordersByDate[date] || 0) + 1;
  });

  const ordersData = Object.entries(ordersByDate)
    .sort(([a], [b]) => {
      const dateA = new Date(a.split('.').reverse().join('-'));
      const dateB = new Date(b.split('.').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    })
    .map(([label, value]) => ({ label, value }));

  // Динамика выручки по дням (BarChart)
  const revenueByDate: Record<string, number> = {};
  filteredOrders
    .filter(o => o.status === 'completed')
    .forEach(order => {
      const date = new Date(order.received_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const revenue = Number(order.final_cost || order.estimated_cost || 0);
      revenueByDate[date] = (revenueByDate[date] || 0) + revenue;
    });

  const revenueData = Object.entries(revenueByDate)
    .sort(([a], [b]) => {
      const dateA = new Date(a.split('.').reverse().join('-'));
      const dateB = new Date(b.split('.').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    })
    .map(([label, value]) => ({ label, value }));

  // Расчет трендов (сравнение с предыдущим периодом)
  const getPreviousPeriodOrders = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const periodEnd = new Date();
    periodEnd.setHours(0, 0, 0, 0);
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    
    switch (period) {
      case '7':
        periodEnd.setDate(now.getDate() - 7);
        periodStart.setDate(now.getDate() - 14);
        break;
      case '30':
        periodEnd.setDate(now.getDate() - 30);
        periodStart.setDate(now.getDate() - 60);
        break;
      case '90':
        periodEnd.setDate(now.getDate() - 90);
        periodStart.setDate(now.getDate() - 180);
        break;
      case '365':
        periodEnd.setDate(now.getDate() - 365);
        periodStart.setDate(now.getDate() - 730);
        break;
    }
    
    return orders.filter(order => {
      const orderDate = new Date(order.received_date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate >= periodStart && orderDate < periodEnd;
    });
  };

  const previousOrders = getPreviousPeriodOrders();
  const previousTotal = previousOrders.length;
  const previousCompleted = previousOrders.filter(o => o.status === 'completed').length;
  const previousInProgress = previousOrders.filter(o => o.status === 'in_progress').length;
  const previousCancelled = previousOrders.filter(o => o.status === 'cancelled').length;
  const previousRevenue = previousOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.final_cost || o.estimated_cost || 0), 0);
  
  const previousCompletedWithDate = previousOrders.filter(o => 
    o.status === 'completed' && o.completed_date && o.received_date
  );
  const previousAvgTime = previousCompletedWithDate.length > 0
    ? previousCompletedWithDate.reduce((sum, o) => {
        const start = new Date(o.received_date);
        const end = new Date(o.completed_date!);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / previousCompletedWithDate.length
    : 0;

  const totalOrdersTrend = previousTotal > 0 
    ? ((totalOrders - previousTotal) / previousTotal) * 100 
    : (totalOrders > 0 ? 100 : 0);
  const completedTrend = previousCompleted > 0 
    ? ((completedOrders - previousCompleted) / previousCompleted) * 100 
    : (completedOrders > 0 ? 100 : 0);
  const revenueTrend = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : (totalRevenue > 0 ? 100 : 0);
  const avgTimeTrend = previousAvgTime > 0
    ? ((avgCompletionTime - previousAvgTime) / previousAvgTime) * 100
    : 0;
  const inProgressTrend = previousInProgress > 0
    ? ((inProgressOrders - previousInProgress) / previousInProgress) * 100
    : (inProgressOrders > 0 ? 100 : 0);
  const cancelledTrend = previousCancelled > 0
    ? ((cancelledOrders - previousCancelled) / previousCancelled) * 100
    : (cancelledOrders > 0 ? 100 : 0);

  // Распределение по приоритетам - используем ВСЕ заказы
  const priorityCounts: Record<string, number> = {};
  orders.forEach(order => {
    const priority = order.priority || 'normal';
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
  });

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

  const priorityData = Object.entries(priorityCounts)
    .map(([priority, count]) => ({
      label: priorityLabels[priority] || priority,
      value: count,
      color: priorityColors[priority] || '#6b7280',
    }))
    .filter(item => item.value > 0);

  // Выручка по типам устройств - используем ВСЕ заказы и показываем все типы
  const revenueByDevice: Record<string, number> = {};
  
  // Инициализируем все типы устройств нулями
  Object.keys(deviceTypeLabels).forEach(type => {
    revenueByDevice[type] = 0;
  });
  
  // Рассчитываем выручку для каждого типа
  orders
    .filter(o => o.status === 'completed')
    .forEach(order => {
      const type = order.device_type || 'other';
      const revenue = Number(order.final_cost || order.estimated_cost || 0);
      revenueByDevice[type] = (revenueByDevice[type] || 0) + revenue;
    });

  // Показываем все типы устройств, даже если выручка 0
  const revenueByDeviceData = Object.entries(deviceTypeLabels)
    .map(([type, label]) => ({
      label: label,
      value: Math.round(revenueByDevice[type] || 0),
    }))
    .sort((a, b) => b.value - a.value); // Сортируем по убыванию выручки

  // Статистика по техникам (используем все заказы, не только отфильтрованные)
  const technicianStats = technicians.map((tech) => {
    const techOrders = orders.filter((order) => order.assigned_to === tech.id);
    const completedOrders = techOrders.filter((order) => order.status === 'completed');
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.final_cost || order.estimated_cost || 0),
      0
    );
    const avgCompletionTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, order) => {
          if (order.completed_date && order.received_date) {
            const start = new Date(order.received_date);
            const end = new Date(order.completed_date);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0) / completedOrders.length
      : 0;

    return {
      id: tech.id,
      name: tech.full_name,
      totalOrders: techOrders.length,
      completedOrders: completedOrders.length,
      revenue: totalRevenue,
      avgTime: avgCompletionTime,
      completionRate: techOrders.length > 0 
        ? (completedOrders.length / techOrders.length) * 100 
        : 0,
    };
  }).sort((a, b) => {
    // Сначала сортируем по проценту выполнения (100% сначала)
    if (a.completionRate === 100 && b.completionRate !== 100) return -1;
    if (a.completionRate !== 100 && b.completionRate === 100) return 1;
    // Если оба 100% или оба не 100%, сортируем по количеству заказов
    return b.totalOrders - a.totalOrders;
  });

  // Топ-5 проблем - просто первые 5 описаний проблем из ВСЕХ заказов, отсортированных по дате
  const topIssues = orders
    .sort((a, b) => new Date(a.received_date).getTime() - new Date(b.received_date).getTime())
    .slice(0, 5)
    .map((order, index) => ({
      label: order.issue_description.length > 50 
        ? order.issue_description.substring(0, 50) + '...' 
        : order.issue_description,
      value: index + 1,
      fullDescription: order.issue_description,
    }));

  const periodLabels: Record<PeriodType, string> = {
    '7': '7 дней',
    '30': '30 дней',
    '90': '90 дней',
    '365': 'Год',
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Дашборд KPI</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Обзор ключевых показателей эффективности и аналитика</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as PeriodType);
              }}
              className="border-0 focus:ring-0 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
            >
              <option value="7">7 дней</option>
              <option value="30">30 дней</option>
              <option value="90">90 дней</option>
              <option value="365">Год</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Всего заказов"
          value={totalOrders}
          icon={TrendingUp}
          trend={{ value: totalOrdersTrend, isPositive: totalOrdersTrend >= 0 }}
          color="blue"
        />
        <MetricCard
          title="Завершено"
          value={completedOrders}
          icon={CheckCircle}
          trend={{ value: completedTrend, isPositive: completedTrend >= 0 }}
          color="green"
        />
        <MetricCard
          title="Выручка"
          value={`${totalRevenue.toLocaleString('ru-RU')} ₽`}
          icon={DollarSign}
          trend={{ value: revenueTrend, isPositive: revenueTrend >= 0 }}
          color="teal"
        />
        <MetricCard
          title="Среднее время выполнения"
          value={`${avgCompletionTime.toFixed(1)} ч`}
          icon={Clock}
          trend={{ value: avgTimeTrend, isPositive: avgTimeTrend <= 0 }}
          color="orange"
        />
        <MetricCard
          title="В работе"
          value={inProgressOrders}
          icon={TrendingUp}
          trend={{ value: inProgressTrend, isPositive: inProgressTrend >= 0 }}
          color="purple"
        />
        <MetricCard
          title="Отменено"
          value={cancelledOrders}
          icon={XCircle}
          trend={{ value: cancelledTrend, isPositive: cancelledTrend <= 0 }}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Статус заказов</h3>
          <div className="flex justify-center">
            {orderStatusData.length > 0 ? (
            <DonutChart
              data={orderStatusData}
              size={240}
              centerLabel="Всего"
                centerValue={allTotalOrders.toString()}
            />
            ) : (
              <div className="flex items-center justify-center h-60 text-gray-400 dark:text-gray-500">
                Нет данных
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Приоритеты заказов</h3>
          <div className="flex justify-center">
            {priorityData.length > 0 ? (
              <DonutChart
                data={priorityData}
                size={240}
                centerLabel="Всего"
                centerValue={orders.length.toString()}
              />
            ) : (
              <div className="flex items-center justify-center h-60 text-gray-400 dark:text-gray-500">
                Нет данных
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Типы устройств</h3>
          <div className="flex justify-center">
            {deviceTypeData.length > 0 ? (
              <PieChart data={deviceTypeData} size={240} />
            ) : (
              <div className="flex items-center justify-center h-60 text-gray-400 dark:text-gray-500">
                Нет данных
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Выручка по типам устройств (₽)</h3>
          {revenueByDeviceData.length > 0 ? (
            <StackedBarChart data={revenueByDeviceData} height={250} />
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 dark:text-gray-500">
              Нет данных
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Динамика заказов ({periodLabels[period]})
          </h3>
          {ordersData.length > 0 ? (
            <BarChart data={ordersData} height={250} color="#3b82f6" />
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 dark:text-gray-500">
              Нет данных
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Динамика выручки ({periodLabels[period]})
          </h3>
          {revenueData.length > 0 ? (
            <BarChart data={revenueData} height={250} color="#10b981" />
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 dark:text-gray-500">
              Нет данных
            </div>
          )}
        </div>
      </div>

      {/* Статистика по техникам */}
      {technicianStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6 md:mb-8">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Статистика по техникам</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Техник</th>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Всего заказов</th>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Завершено</th>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Выручка</th>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Среднее время</th>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% выполнения</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {technicianStats.map((stat) => (
                  <tr key={stat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 md:px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{stat.name}</td>
                    <td className="px-2 md:px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{stat.totalOrders}</td>
                    <td className="px-2 md:px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{stat.completedOrders}</td>
                    <td className="px-2 md:px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {stat.revenue.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-2 md:px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {stat.avgTime > 0 ? `${stat.avgTime.toFixed(1)} ч` : '-'}
                    </td>
                    <td className="px-2 md:px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${stat.completionRate}%` }}
                          />
                        </div>
                        <span className="text-gray-600 dark:text-gray-300 w-12 text-right">
                          {stat.completionRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Топ проблем */}
      {topIssues.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Топ-5 проблем (по дате поступления)</h3>
          <div className="space-y-3">
            {topIssues.map((issue, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white" title={issue.fullDescription}>
                      {issue.label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
