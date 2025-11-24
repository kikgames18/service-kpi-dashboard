// Утилиты для экспорта данных

export interface ExportableOrder {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  device_type: string;
  device_brand: string | null;
  device_model: string | null;
  issue_description: string;
  status: string;
  priority: string;
  received_date: string;
  completed_date: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  technician_name?: string | null;
}

// Экспорт в CSV
export function exportToCSV(data: ExportableOrder[], filename: string = 'orders') {
  if (data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    completed: 'Завершено',
    cancelled: 'Отменено',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Низкий',
    normal: 'Обычный',
    high: 'Высокий',
    urgent: 'Срочный',
  };

  const deviceTypeLabels: Record<string, string> = {
    computer: 'Компьютер',
    laptop: 'Ноутбук',
    household_appliance: 'Бытовая техника',
    phone: 'Телефон',
    other: 'Прочее',
  };

  // Заголовки CSV
  const headers = [
    'Номер заказа',
    'Клиент',
    'Телефон',
    'Тип устройства',
    'Бренд',
    'Модель',
    'Описание проблемы',
    'Статус',
    'Приоритет',
    'Дата получения',
    'Дата завершения',
    'Предварительная стоимость',
    'Финальная стоимость',
    'Техник',
  ];

  // Преобразование данных в строки CSV
  const rows = data.map((order) => [
    order.order_number,
    order.customer_name,
    order.customer_phone,
    deviceTypeLabels[order.device_type] || order.device_type,
    order.device_brand || '',
    order.device_model || '',
    order.issue_description,
    statusLabels[order.status] || order.status,
    priorityLabels[order.priority] || order.priority,
    new Date(order.received_date).toLocaleDateString('ru-RU'),
    order.completed_date ? new Date(order.completed_date).toLocaleDateString('ru-RU') : '',
    order.estimated_cost ? `${order.estimated_cost.toLocaleString('ru-RU')} ₽` : '',
    order.final_cost ? `${order.final_cost.toLocaleString('ru-RU')} ₽` : '',
    order.technician_name || '',
  ]);

  // Объединение заголовков и данных
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Экранирование кавычек и запятых
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    ),
  ].join('\n');

  // Добавление BOM для корректного отображения кириллицы в Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Экспорт в Excel (через CSV с расширением .xlsx, который откроется в Excel)
export function exportToExcel(data: ExportableOrder[], filename: string = 'orders') {
  // Используем CSV формат, но с расширением .xlsx
  // Excel откроет CSV файл корректно
  exportToCSV(data, filename);
  
  // Альтернативно можно использовать библиотеку xlsx, но для простоты используем CSV
  // Если нужна более сложная функциональность, можно добавить: npm install xlsx
}

// Экспорт в PDF (простой вариант через window.print)
export function exportToPDF(data: ExportableOrder[], filename: string = 'orders') {
  // Создаем временное окно с таблицей для печати
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Пожалуйста, разрешите всплывающие окна для экспорта в PDF');
    return;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    completed: 'Завершено',
    cancelled: 'Отменено',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Низкий',
    normal: 'Обычный',
    high: 'Высокий',
    urgent: 'Срочный',
  };

  const deviceTypeLabels: Record<string, string> = {
    computer: 'Компьютер',
    laptop: 'Ноутбук',
    household_appliance: 'Бытовая техника',
    phone: 'Телефон',
    other: 'Прочее',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Отчет по заказам</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          font-size: 12px;
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <h1>Отчет по заказам</h1>
      <p>Дата формирования: ${new Date().toLocaleString('ru-RU')}</p>
      <p>Всего записей: ${data.length}</p>
      <table>
        <thead>
          <tr>
            <th>Номер</th>
            <th>Клиент</th>
            <th>Телефон</th>
            <th>Устройство</th>
            <th>Статус</th>
            <th>Приоритет</th>
            <th>Дата получения</th>
            <th>Стоимость</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (order) => `
            <tr>
              <td>${order.order_number}</td>
              <td>${order.customer_name}</td>
              <td>${order.customer_phone}</td>
              <td>${deviceTypeLabels[order.device_type] || order.device_type}</td>
              <td>${statusLabels[order.status] || order.status}</td>
              <td>${priorityLabels[order.priority] || order.priority}</td>
              <td>${new Date(order.received_date).toLocaleDateString('ru-RU')}</td>
              <td>${order.final_cost ? `${order.final_cost.toLocaleString('ru-RU')} ₽` : order.estimated_cost ? `~${order.estimated_cost.toLocaleString('ru-RU')} ₽` : '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Ждем загрузки и открываем диалог печати
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

// Экспорт в 1С (XML формат обмена данными)
export function exportTo1C(data: ExportableOrder[], filename: string = 'orders') {
  if (data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    completed: 'Завершено',
    cancelled: 'Отменено',
  };

  const deviceTypeLabels: Record<string, string> = {
    computer: 'Компьютер',
    laptop: 'Ноутбук',
    household_appliance: 'Бытовая техника',
    phone: 'Телефон',
    other: 'Прочее',
  };

  // XML формат для обмена с 1С
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<ОбменДанными>
  <ВерсияФормата>1.0</ВерсияФормата>
  <ДатаФормирования>${new Date().toISOString()}</ДатаФормирования>
  <Заказы>
    ${data.map((order) => `
    <Заказ>
      <Номер>${escapeXML(order.order_number)}</Номер>
      <Клиент>
        <Наименование>${escapeXML(order.customer_name)}</Наименование>
        <Телефон>${escapeXML(order.customer_phone)}</Телефон>
      </Клиент>
      <Устройство>
        <Тип>${escapeXML(deviceTypeLabels[order.device_type] || order.device_type)}</Тип>
        <Бренд>${escapeXML(order.device_brand || '')}</Бренд>
        <Модель>${escapeXML(order.device_model || '')}</Модель>
      </Устройство>
      <ОписаниеПроблемы>${escapeXML(order.issue_description)}</ОписаниеПроблемы>
      <Статус>${escapeXML(statusLabels[order.status] || order.status)}</Статус>
      <Приоритет>${escapeXML(order.priority)}</Приоритет>
      <ДатаПолучения>${new Date(order.received_date).toISOString()}</ДатаПолучения>
      ${order.completed_date ? `<ДатаЗавершения>${new Date(order.completed_date).toISOString()}</ДатаЗавершения>` : ''}
      ${order.estimated_cost ? `<ПредварительнаяСтоимость>${order.estimated_cost}</ПредварительнаяСтоимость>` : ''}
      ${order.final_cost ? `<ФинальнаяСтоимость>${order.final_cost}</ФинальнаяСтоимость>` : ''}
      ${order.technician_name ? `<Техник>${escapeXML(order.technician_name)}</Техник>` : ''}
    </Заказ>`).join('')}
  </Заказы>
</ОбменДанными>`;

  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_1C_${new Date().toISOString().split('T')[0]}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

