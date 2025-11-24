import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';

interface ServiceOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  device_type: string;
  device_brand: string | null;
  device_model: string | null;
  issue_description: string;
  status: string;
  priority: string;
  estimated_cost: number | null;
  final_cost: number | null;
  assigned_to: string | null;
  completed_date: string | null;
}

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: ServiceOrder | null;
}

export function EditOrderModal({ isOpen, onClose, onSuccess, order }: EditOrderModalProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    device_type: 'computer',
    device_brand: '',
    device_model: '',
    issue_description: '',
    status: 'pending',
    priority: 'normal',
    estimated_cost: '',
    final_cost: '',
    assigned_to: '',
  });
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      setFormData({
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        device_type: order.device_type || 'computer',
        device_brand: order.device_brand || '',
        device_model: order.device_model || '',
        issue_description: order.issue_description || '',
        status: order.status || 'pending',
        priority: order.priority || 'normal',
        estimated_cost: order.estimated_cost ? String(order.estimated_cost) : '',
        final_cost: order.final_cost ? String(order.final_cost) : '',
        assigned_to: order.assigned_to || '',
      });
      loadTechnicians();
    }
  }, [isOpen, order]);

  const loadTechnicians = async () => {
    try {
      const data = await api.getTechnicians();
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setError('');
    setLoading(true);

    try {
      await api.updateOrder(order.id, {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        device_type: formData.device_type,
        device_brand: formData.device_brand || undefined,
        device_model: formData.device_model || undefined,
        issue_description: formData.issue_description,
        status: formData.status,
        priority: formData.priority,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
        final_cost: formData.final_cost ? parseFloat(formData.final_cost) : undefined,
        assigned_to: formData.assigned_to || undefined,
        completed_date: formData.status === 'completed' && !order.completed_date 
          ? new Date().toISOString() 
          : formData.status !== 'completed' 
          ? null 
          : undefined,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Ошибка при обновлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Редактировать заказ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Номер заказа:</p>
            <p className="font-semibold text-gray-900">{order.order_number}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя клиента *
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон клиента *
              </label>
              <input
                type="tel"
                required
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип устройства *
              </label>
              <select
                required
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="computer">Компьютер</option>
                <option value="laptop">Ноутбук</option>
                <option value="household_appliance">Бытовая техника</option>
                <option value="phone">Телефон</option>
                <option value="other">Прочее</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Бренд
              </label>
              <input
                type="text"
                value={formData.device_brand}
                onChange={(e) => setFormData({ ...formData, device_brand: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Модель
              </label>
              <input
                type="text"
                value={formData.device_model}
                onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание проблемы *
            </label>
            <textarea
              required
              rows={3}
              value={formData.issue_description}
              onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Ожидает</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Низкий</option>
                <option value="normal">Обычный</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочный</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Предв. стоимость (₽)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Финальная стоимость (₽)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.final_cost}
                onChange={(e) => setFormData({ ...formData, final_cost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Назначить техника
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Не назначен</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

