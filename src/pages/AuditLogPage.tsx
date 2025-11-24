import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { History, User, FileText, Users } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changed_by: string | null;
  changed_by_email: string | null;
  changed_by_name: string | null;
  old_values: any;
  new_values: any;
  changed_fields: string[] | null;
  created_at: string;
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ entityType?: string; entityId?: string }>({});

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLog(filter.entityType, filter.entityId, 100);
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <FileText className="w-4 h-4" />;
      case 'technician':
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case 'order':
        return 'Заказ';
      case 'technician':
        return 'Сотрудник';
      case 'profile':
        return 'Профиль';
      default:
        return type;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Создание';
      case 'update':
        return 'Обновление';
      case 'delete':
        return 'Удаление';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'update':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'delete':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'Ожидает',
      in_progress: 'В работе',
      completed: 'Завершено',
      cancelled: 'Отменено',
    };
    return statusMap[status] || status;
  };

  const getPriorityLabel = (priority: string): string => {
    const priorityMap: Record<string, string> = {
      low: 'Низкий',
      normal: 'Обычный',
      high: 'Высокий',
      urgent: 'Срочный',
    };
    return priorityMap[priority] || priority;
  };

  const getDeviceTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      computer: 'Компьютер',
      laptop: 'Ноутбук',
      household_appliance: 'Бытовая техника',
      phone: 'Телефон',
      other: 'Прочее',
    };
    return typeMap[type] || type;
  };

  const getSpecializationLabel = (spec: string): string => {
    const specMap: Record<string, string> = {
      computer: 'Компьютеры',
      household: 'Бытовая техника',
      mobile: 'Мобильные устройства',
      universal: 'Универсал',
    };
    return specMap[spec] || spec;
  };

  const formatChanges = (log: AuditLogEntry): string => {
    if (!log.old_values || !log.new_values || log.action === 'create') {
      return '—';
    }

    const oldVals = typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values;
    const newVals = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values;

    const changes: string[] = [];

    // Check for password change separately (for security, don't show password values)
    if (log.entity_type === 'profile' && (oldVals.password_changed || newVals.password_changed)) {
      changes.push('Смена пароля');
    }

    // Check common fields (excluding hire_date - it's shown in Info column)
    const fieldsToCheck = ['status', 'priority', 'customer_name', 'device_type', 'full_name', 'specialization', 'is_active', 'issue_description', 'assigned_to', 'email'];
    
    for (const field of fieldsToCheck) {
      const oldVal = oldVals[field];
      const newVal = newVals[field];
      
      // For assigned_to, compare UUIDs but also check if technician_name changed
      let hasChanged = false;
      if (field === 'assigned_to') {
        // Check if UUID changed
        const oldUuid = oldVal ? String(oldVal) : null;
        const newUuid = newVal ? String(newVal) : null;
        hasChanged = oldUuid !== newUuid;
        
        // Also check if technician_name is different (for old records without names)
        if (!hasChanged && oldVals.technician_name !== newVals.technician_name) {
          hasChanged = true;
        }
      } else {
        hasChanged = oldVal !== newVal && (oldVal !== null || newVal !== null);
      }
      
      if (hasChanged) {
        let oldLabel = formatFieldValue(oldVal);
        let newLabel = formatFieldValue(newVal);

        // Format specific fields
        if (field === 'status') {
          oldLabel = getStatusLabel(oldLabel);
          newLabel = getStatusLabel(newLabel);
        } else if (field === 'priority') {
          oldLabel = getPriorityLabel(oldLabel);
          newLabel = getPriorityLabel(newLabel);
        } else if (field === 'device_type') {
          oldLabel = getDeviceTypeLabel(oldLabel);
          newLabel = getDeviceTypeLabel(newLabel);
        } else if (field === 'specialization') {
          oldLabel = getSpecializationLabel(oldLabel);
          newLabel = getSpecializationLabel(newLabel);
        } else if (field === 'is_active') {
          oldLabel = oldVal ? 'Активен' : 'Неактивен';
          newLabel = newVal ? 'Активен' : 'Неактивен';
        } else if (field === 'assigned_to') {
          // Use technician_name from the values (added on backend)
          // If technician_name is not available, show "Не назначен"
          if (oldVal) {
            oldLabel = oldVals.technician_name || 'Не назначен';
          } else {
            oldLabel = 'Не назначен';
          }
          
          if (newVal) {
            newLabel = newVals.technician_name || 'Не назначен';
          } else {
            newLabel = 'Не назначен';
          }
        }

        const fieldLabels: Record<string, string> = {
          status: 'Статус',
          priority: 'Приоритет',
          customer_name: 'Клиент',
          device_type: 'Устройство',
          full_name: 'Полное имя',
          specialization: 'Специализация',
          is_active: 'Статус',
          issue_description: 'Описание проблемы',
          assigned_to: 'ФИО',
          email: 'Email',
        };

        // Special formatting for assigned_to
        if (field === 'assigned_to') {
          // Always show change if UUIDs are different, even if names are the same or missing
          const oldUuid = oldVal ? String(oldVal) : null;
          const newUuid = newVal ? String(newVal) : null;
          
          if (oldUuid !== newUuid) {
            // UUIDs are different, so there's a change
            // Only show if at least one has a real name (not "Не назначен" for both)
            if (oldLabel === 'Не назначен' && newLabel === 'Не назначен') {
              // Both are "Не назначен" - this means old records without technician_name
              // Don't show this as a change, skip it
            } else if (oldLabel === 'Не назначен') {
              changes.push(`Был техник не назначен → стал ${newLabel}`);
            } else if (newLabel === 'Не назначен') {
              changes.push(`Был техник ${oldLabel} → стал не назначен`);
            } else if (oldLabel !== newLabel) {
              // Both have names and they're different
              changes.push(`Был техник ${oldLabel} → стал ${newLabel}`);
            }
            // If both have the same name, don't show (shouldn't happen if UUIDs differ, but just in case)
          }
          // If UUIDs are the same, no change - skip
        } else {
          changes.push(`${fieldLabels[field] || field}: ${oldLabel} → ${newLabel}`);
        }
      }
    }

    return changes.length > 0 ? changes.join(', ') : '—';
  };

  const getEntityInfo = (log: AuditLogEntry): { label: string; value: string }[] => {
    const info: { label: string; value: string }[] = [];
    
    try {
      const values = log.new_values 
        ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values)
        : (log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : {});

      if (log.entity_type === 'order') {
        if (values.customer_name) {
          info.push({ label: 'Клиент', value: values.customer_name });
        }
        if (values.device_type) {
          const device = getDeviceTypeLabel(values.device_type);
          const brand = values.device_brand ? ` ${values.device_brand}` : '';
          const model = values.device_model ? ` ${values.device_model}` : '';
          info.push({ label: 'Устройство', value: `${device}${brand}${model}`.trim() });
        }
      } else if (log.entity_type === 'technician') {
        if (values.full_name) {
          info.push({ label: 'ФИО', value: values.full_name });
        }
        if (values.hire_date) {
          const hireDate = new Date(values.hire_date);
          info.push({ label: 'Дата найма', value: hireDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) });
        }
      }
    } catch (e) {
      console.error('Error parsing entity info:', e);
    }

    return info;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <History className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">История изменений</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Лог всех изменений в системе</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Тип сущности
              </label>
              <select
                value={filter.entityType || ''}
                onChange={(e) => setFilter({ ...filter, entityType: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Все типы</option>
                <option value="order">Заказы</option>
                <option value="technician">Сотрудники</option>
                <option value="profile">Профили</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID сущности
              </label>
              <input
                type="text"
                value={filter.entityId || ''}
                onChange={(e) => setFilter({ ...filter, entityId: e.target.value || undefined })}
                placeholder="Введите ID..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Тип</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действие</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Изменил</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Изменения</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Информация</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getEntityIcon(log.entity_type)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getEntityLabel(log.entity_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(
                        log.action
                      )}`}
                    >
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.changed_by_name || log.changed_by_email || 'Система'}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="max-w-md">
                      {formatChanges(log)}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {getEntityInfo(log).length > 0 ? (
                      <div className="space-y-1">
                        {getEntityInfo(log).map((info, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="text-gray-500 dark:text-gray-400">{info.label}:</span>{' '}
                            <span className="font-medium text-gray-900 dark:text-white">{info.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            История изменений пуста
          </div>
        )}
      </div>
    </div>
  );
}

