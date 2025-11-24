import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Download, Upload, Database, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export function BackupPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [backupData, setBackupData] = useState<any>(null);

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Доступ запрещен</p>
          </div>
          <p className="text-red-600 dark:text-red-300 mt-2 text-sm">
            Только администраторы могут управлять резервными копиями.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const backup = await api.createBackup();
      setBackupData(backup);
      
      // Скачать файл
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Резервная копия успешно создана и загружена' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ошибка при создании резервной копии' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data || !backup.version) {
        throw new Error('Неверный формат файла резервной копии');
      }

      // Подтверждение
      const confirmed = window.confirm(
        'ВНИМАНИЕ! Восстановление из резервной копии заменит все текущие данные (кроме пользователей). Продолжить?'
      );

      if (!confirmed) {
        setLoading(false);
        return;
      }

      await api.restoreBackup(backup);
      setMessage({ type: 'success', text: 'Резервная копия успешно восстановлена' });
      
      // Обновить страницу через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ошибка при восстановлении резервной копии' });
    } finally {
      setLoading(false);
      // Сбросить input
      event.target.value = '';
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Резервное копирование</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Создание и восстановление резервных копий данных</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Создание резервной копии */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Создать резервную копию</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Экспорт всех данных системы</p>
            </div>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 text-base">Что будет включено:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2.5">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Все заказы</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Все сотрудники</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>История изменений</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Уведомления</span>
                </li>
                <li className="flex items-start text-gray-500 dark:text-gray-500">
                  <span className="mr-2">•</span>
                  <span>Пользователи (не включаются в резервную копию)</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Создание...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Создать резервную копию</span>
              </>
            )}
          </button>
        </div>

        {/* Восстановление из резервной копии */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Восстановить из копии</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Импорт данных из файла</p>
            </div>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-2 text-base">Внимание!</p>
                  <p>Восстановление заменит все текущие данные (кроме пользователей). Убедитесь, что у вас есть актуальная резервная копия.</p>
                </div>
              </div>
            </div>
          </div>

          <label className="block mt-6">
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              disabled={loading}
              className="hidden"
              id="backup-file-input"
            />
            <div className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Восстановление...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Выбрать файл и восстановить</span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Информация о резервной копии */}
      {backupData && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Информация о резервной копии</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Версия формата:</p>
              <p className="font-medium text-gray-900 dark:text-white">{backupData.version}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Дата создания:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(backupData.created_at).toLocaleString('ru-RU')}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Заказов:</p>
              <p className="font-medium text-gray-900 dark:text-white">{backupData.data?.orders?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Сотрудников:</p>
              <p className="font-medium text-gray-900 dark:text-white">{backupData.data?.technicians?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Записей в истории:</p>
              <p className="font-medium text-gray-900 dark:text-white">{backupData.data?.audit_log?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Уведомлений:</p>
              <p className="font-medium text-gray-900 dark:text-white">{backupData.data?.notifications?.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

