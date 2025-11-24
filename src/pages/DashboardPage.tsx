import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { MetricCard } from '../components/MetricCard';
import { DonutChart } from '../components/charts/DonutChart';
import { LineChart } from '../components/charts/LineChart';
import { PieChart } from '../components/charts/PieChart';
import { TrendingUp, CheckCircle, XCircle, DollarSign, Clock, Star } from 'lucide-react';

interface KPIMetric {
  metric_date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  revenue: number;
  avg_completion_time_hours: number;
  customer_satisfaction: number;
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await api.getKpiMetrics(7);
      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
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

  const latestMetric = metrics[0];
  const totalRevenue = metrics.reduce((sum, m) => sum + Number(m.revenue), 0);
  const totalOrders = metrics.reduce((sum, m) => sum + m.total_orders, 0);
  const totalCompleted = metrics.reduce((sum, m) => sum + m.completed_orders, 0);
  const avgSatisfaction = metrics.reduce((sum, m) => sum + m.customer_satisfaction, 0) / metrics.length;

  const orderStatusData = [
    { label: 'Завершено', value: totalCompleted, color: '#10b981' },
    { label: 'Отменено', value: metrics.reduce((sum, m) => sum + m.cancelled_orders, 0), color: '#ef4444' },
    { label: 'В работе', value: totalOrders - totalCompleted - metrics.reduce((sum, m) => sum + m.cancelled_orders, 0), color: '#f59e0b' },
  ];

  const revenueData = metrics
    .slice()
    .reverse()
    .map((m) => ({
      label: new Date(m.metric_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      value: Number(m.revenue),
    }));

  const completionTimeData = [
    { label: 'Быстрый', value: 15, color: '#10b981' },
    { label: 'Средний', value: 45, color: '#3b82f6' },
    { label: 'Медленный', value: 25, color: '#f59e0b' },
    { label: 'Очень медленный', value: 15, color: '#ef4444' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Панель KPI</h1>
        <p className="text-gray-600 mt-1">Обзор ключевых показателей эффективности</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Всего заказов"
          value={latestMetric?.total_orders || 0}
          icon={TrendingUp}
          trend={{ value: 12.5, isPositive: true }}
          color="blue"
        />
        <MetricCard
          title="Завершено"
          value={latestMetric?.completed_orders || 0}
          icon={CheckCircle}
          trend={{ value: 8.3, isPositive: true }}
          color="green"
        />
        <MetricCard
          title="Выручка за день"
          value={`${Number(latestMetric?.revenue || 0).toLocaleString('ru-RU')} ₽`}
          icon={DollarSign}
          trend={{ value: 15.2, isPositive: true }}
          color="teal"
        />
        <MetricCard
          title="Среднее время выполнения"
          value={`${latestMetric?.avg_completion_time_hours || 0} ч`}
          icon={Clock}
          trend={{ value: 5.1, isPositive: false }}
          color="orange"
        />
        <MetricCard
          title="Удовлетворенность клиентов"
          value={avgSatisfaction.toFixed(1)}
          icon={Star}
          trend={{ value: 3.2, isPositive: true }}
          color="purple"
        />
        <MetricCard
          title="Отменено"
          value={latestMetric?.cancelled_orders || 0}
          icon={XCircle}
          trend={{ value: 2.1, isPositive: false }}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Статус заказов</h3>
          <div className="flex justify-center">
            <DonutChart
              data={orderStatusData}
              size={240}
              centerLabel="Всего"
              centerValue={totalOrders.toString()}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение времени выполнения</h3>
          <div className="flex justify-center">
            <PieChart data={completionTimeData} size={240} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Динамика выручки (7 дней)</h3>
        <LineChart data={revenueData} height={250} color="#10b981" />
      </div>
    </div>
  );
}
