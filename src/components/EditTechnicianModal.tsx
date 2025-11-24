import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';

interface Technician {
  id: string;
  full_name: string;
  specialization: string | null;
  hire_date: string;
  is_active: boolean;
}

interface EditTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  technician: Technician | null;
}

export function EditTechnicianModal({ isOpen, onClose, onSuccess, technician }: EditTechnicianModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    specialization: 'universal',
    hire_date: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && technician) {
      setFormData({
        full_name: technician.full_name || '',
        specialization: technician.specialization || 'universal',
        hire_date: technician.hire_date ? technician.hire_date.split('T')[0] : new Date().toISOString().split('T')[0],
        is_active: technician.is_active !== undefined ? technician.is_active : true,
      });
    }
  }, [isOpen, technician]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!technician) return;

    setError('');
    setLoading(true);

    try {
      await api.updateTechnician(technician.id, {
        full_name: formData.full_name,
        specialization: formData.specialization,
        hire_date: formData.hire_date,
        is_active: formData.is_active,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Ошибка при обновлении сотрудника');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !technician) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Редактировать сотрудника</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ФИО *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Специализация
            </label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="computer">Компьютеры</option>
              <option value="household">Бытовая техника</option>
              <option value="mobile">Мобильные устройства</option>
              <option value="universal">Универсальный</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата найма
            </label>
            <input
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
              Активен
            </label>
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

