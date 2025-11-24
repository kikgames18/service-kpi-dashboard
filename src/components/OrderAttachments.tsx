import { useState, useEffect } from 'react';
import { Upload, X, Download, File, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface OrderAttachmentsProps {
  orderId: string;
  isAdmin?: boolean;
}

export function OrderAttachments({ orderId, isAdmin }: OrderAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadAttachments();
    }
  }, [orderId]);

  const loadAttachments = async () => {
    try {
      const data = await api.getOrderAttachments(orderId);
      setAttachments(data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadOrderAttachment(orderId, file);
      await loadAttachments();
      e.target.value = ''; // Reset input
    } catch (error: any) {
      alert('Ошибка при загрузке файла: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    try {
      await api.deleteAttachment(id);
      await loadAttachments();
    } catch (error: any) {
      alert('Ошибка при удалении файла: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const handleDownload = (id: string, fileName: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const token = localStorage.getItem('token');
    const url = `${apiUrl}/data/attachments/${id}/download`;
    // Create a temporary link to download with auth header
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {uploading ? 'Загрузка...' : 'Нажмите для загрузки файла'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Изображения, PDF, DOC, DOCX, TXT (до 10MB)
            </span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
          </label>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Прикрепленные файлы</h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(attachment.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.file_size)} •{' '}
                      {new Date(attachment.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(attachment.id, attachment.file_name)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Скачать"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

