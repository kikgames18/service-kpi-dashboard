import { useState } from 'react';
import { Book, Phone, Mail, User, Info, FileText, BarChart3, ClipboardList, Users, History, Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: 'Как создать новый заказ?',
      answer: 'Перейдите на страницу "Заказы" и нажмите кнопку "+ Новый заказ". Заполните все обязательные поля (отмечены звездочкой) и нажмите "Создать заказ".'
    },
    {
      question: 'Как изменить статус заказа?',
      answer: 'Откройте заказ для редактирования, выберите новый статус в выпадающем списке "Статус" и сохраните изменения.'
    },
    {
      question: 'Как назначить техника на заказ?',
      answer: 'При создании или редактировании заказа выберите техника в поле "Назначить техника". Техник получит уведомление о назначении.'
    },
    {
      question: 'Как экспортировать данные?',
      answer: 'На странице "Заказы" используйте кнопки "Экспорт CSV" или "Экспорт PDF" для выгрузки данных в нужном формате.'
    },
    {
      question: 'Как изменить пароль?',
      answer: 'Перейдите в "Профиль", введите текущий пароль и новый пароль, затем нажмите "Изменить пароль".'
    },
    {
      question: 'Как посмотреть историю изменений?',
      answer: 'Перейдите в раздел "История изменений" (доступен только администраторам). Вы можете фильтровать записи по типу сущности и ID.'
    },
    {
      question: 'Как прикрепить файл к заказу?',
      answer: 'При редактировании заказа внизу формы есть раздел "Прикрепленные файлы". Нажмите "Выбрать файл" и загрузите нужный документ.'
    },
    {
      question: 'Что делать, если забыл пароль?',
      answer: 'Обратитесь к администратору системы или к разработчику по контактным данным, указанным в справочном разделе.'
    }
  ];

  const guideSections = [
    {
      id: 'kpi',
      title: 'Панель KPI',
      icon: BarChart3,
      content: `На странице "Панель KPI" отображаются ключевые показатели эффективности работы сервиса.

**Основные метрики:**
• Всего заказов - общее количество заказов за выбранный период
• Завершено - количество успешно завершенных заказов
• Выручка - общая сумма выручки за период
• Среднее время выполнения - среднее время от получения до завершения заказа
• В работе - количество заказов, находящихся в процессе выполнения
• Отменено - количество отмененных заказов

**Фильтры по периоду:**
Вы можете выбрать период отображения данных:
• 7 дней - данные за последнюю неделю
• 30 дней - данные за последний месяц
• 90 дней - данные за последний квартал
• Год - данные за последний год

**Графики и диаграммы:**
• Динамика заказов - график изменения количества заказов по дням
• Динамика выручки - график изменения выручки по дням
• Статус заказов - распределение заказов по статусам
• Приоритеты заказов - распределение по уровням приоритета
• Типы устройств - распределение заказов по типам устройств
• Выручка по типам устройств - анализ доходности по категориям

**Дополнительная аналитика:**
• Статистика по техникам - эффективность работы каждого сотрудника
• Топ-5 самых частых проблем - наиболее распространенные неисправности`
    },
    {
      id: 'orders',
      title: 'Заказы',
      icon: ClipboardList,
      content: `Страница "Заказы" позволяет управлять всеми заказами на ремонт.

**Просмотр заказов:**
• Список всех заказов с подробной информацией
• Отображение: номер заказа, клиент, устройство, статус, приоритет, техник
• Сортировка по дате получения (новые сверху)
• Пагинация для удобной навигации по большому количеству заказов

**Создание заказа:**
1. Нажмите кнопку "+ Новый заказ"
2. Заполните обязательные поля (отмечены звездочкой):
   - Имя клиента
   - Телефон клиента
   - Тип устройства
   - Описание проблемы
3. Укажите дополнительные данные (опционально):
   - Бренд и модель устройства
   - Приоритет заказа
   - Предварительную стоимость
   - Назначьте техника
4. Нажмите "Создать заказ"

**Редактирование заказа:**
1. Найдите нужный заказ в списке
2. Нажмите кнопку редактирования (иконка карандаша)
3. Измените необходимые поля
4. При изменении статуса на "Завершено" можно указать финальную стоимость
5. Сохраните изменения

**Удаление заказа:**
• Доступно только администраторам
• Нажмите кнопку удаления (иконка корзины)
• Подтвердите удаление

**Фильтрация и поиск:**
• Поиск по номеру заказа, имени клиента или телефону
• Фильтр по дате: сегодня, неделя, месяц, все даты
• Фильтр по статусу: все, ожидает, в работе, завершено, отменено

**Экспорт данных:**
• Экспорт CSV - для работы в Excel
• Экспорт PDF - для печати и архива

**Прикрепление файлов:**
• При редактировании заказа можно прикрепить файлы
• Поддерживаются изображения, документы и другие файлы
• Файлы можно просматривать и удалять`
    },
    {
      id: 'technicians',
      title: 'Сотрудники',
      icon: Users,
      content: `Страница "Сотрудники" предназначена для управления персоналом (доступна только администраторам).

**Просмотр сотрудников:**
• Список всех зарегистрированных техников
• Отображение: ФИО, специализация, дата найма, статус активности
• Пагинация для удобной навигации

**Добавление сотрудника:**
1. Нажмите кнопку "+ Новый сотрудник"
2. Заполните обязательные поля:
   - Полное имя (ФИО)
   - Специализация (компьютеры, бытовая техника, мобильные устройства, универсал)
   - Дата найма (по умолчанию - текущая дата)
3. Установите статус активности (активен/неактивен)
4. Нажмите "Создать сотрудника"

**Редактирование сотрудника:**
1. Найдите сотрудника в списке
2. Нажмите кнопку редактирования
3. Измените необходимые данные
4. Сохраните изменения

**Удаление сотрудника:**
• Нажмите кнопку удаления
• Подтвердите удаление
• Внимание: при удалении сотрудника, назначенного на заказы, заказы останутся, но техник будет не назначен

**Назначение на заказы:**
• При создании или редактировании заказа выберите техника из списка
• Техник получит уведомление о новом назначении
• Можно изменить назначенного техника в любой момент`
    },
    {
      id: 'history',
      title: 'История изменений',
      icon: History,
      content: `Страница "История изменений" содержит полный лог всех действий в системе (доступна только администраторам).

**Что отслеживается:**
• Все изменения в заказах (создание, редактирование, удаление)
• Все изменения в сотрудниках (создание, редактирование, удаление)
• Изменения в профилях пользователей (имя, email, смена пароля)

**Информация о записи:**
• Дата и время изменения
• Тип сущности (заказ, сотрудник, профиль)
• Действие (создание, обновление, удаление)
• Кто внес изменения (имя пользователя)
• Детальные изменения (что именно изменилось)
• Дополнительная информация о сущности

**Фильтрация:**
• По типу сущности: все типы, заказы, сотрудники, профили
• По ID сущности: введите ID для поиска конкретной записи

**Формат отображения изменений:**
• Статус: Ожидает → Завершено
• Приоритет: Низкий → Высокий
• Описание проблемы: старое описание → новое описание
• Техник: Был техник [имя] → стал [имя]
• Полное имя: старое имя → новое имя
• Смена пароля: отображается как "Смена пароля" (без указания паролей)

**Использование:**
История изменений помогает отслеживать все действия в системе, что важно для:
• Аудита и контроля
• Восстановления информации
• Анализа работы сотрудников`
    },
    {
      id: 'profile',
      title: 'Профиль',
      icon: Info,
      content: `Страница "Профиль" позволяет управлять личными данными и настройками аккаунта.

**Просмотр информации:**
• Email (нельзя изменить)
• Полное имя
• Роль (Администратор или Пользователь)

**Изменение имени:**
1. Введите новое полное имя в поле "Полное имя"
2. Нажмите "Сохранить изменения"
3. Изменения сохранятся и отобразятся в системе

**Изменение email:**
1. Введите новый email в поле "Email"
2. Нажмите "Сохранить изменения"
3. Новый email будет использоваться для входа в систему

**Смена пароля:**
1. Введите текущий пароль
2. Введите новый пароль (минимум 6 символов)
3. Подтвердите новый пароль
4. Нажмите "Изменить пароль"
5. После смены пароля используйте новый пароль для входа

**Безопасность:**
• Пароль хранится в зашифрованном виде
• История смены пароля не содержит самих паролей
• При утере пароля обратитесь к администратору

**Уведомления:**
• В профиле отображаются уведомления о важных событиях
• Можно отметить уведомления как прочитанные`
    }
  ];

  const filteredSections = guideSections.filter(section => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query)
    );
  });

  const filteredFAQ = faqItems.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query)
    );
  });
  return (
    <div className="p-4 md:p-6 h-[80vh] flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Book className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Справочный раздел</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Руководство по использованию системы и контактная информация</p>
      </div>

      {/* Поиск */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по руководству и FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Руководство по использованию */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Руководство по использованию</h2>
          </div>

          {filteredSections.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              Ничего не найдено по запросу "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                // Разбиваем контент на абзацы и форматируем
                const paragraphs = section.content.split('\n\n');
                return (
                  <section key={section.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-500" />
                      {section.title}
                    </h3>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                      {paragraphs.map((paragraph, idx) => {
                        // Обработка жирного текста (**текст**)
                        const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                        return (
                          <div key={idx} className="leading-relaxed">
                            {parts.map((part, partIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                const boldText = part.slice(2, -2);
                                return (
                                  <strong key={partIdx} className="font-semibold text-gray-900 dark:text-white">
                                    {boldText}
                                  </strong>
                                );
                              }
                              // Обработка маркированных списков
                              if (part.trim().startsWith('•')) {
                                return (
                                  <div key={partIdx} className="ml-4 mb-1">
                                    {part}
                                  </div>
                                );
                              }
                              return <span key={partIdx}>{part}</span>;
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* FAQ и Контактная информация */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* FAQ раздел */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto flex-1">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Часто задаваемые вопросы (FAQ)</h2>
            </div>

            {filteredFAQ.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                Ничего не найдено по запросу "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFAQ.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">
                        {item.question}
                      </span>
                      {expandedFAQ === index ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFAQ === index && (
                      <div className="p-3 pt-0 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Контактная информация */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Контактная информация</h2>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Разработчик системы</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Максимов Герман Сергеевич</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a 
                          href="tel:+79002015465" 
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          +7 (900) 201-54-65
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a 
                          href="mailto:mr.ropap@yandex.ru" 
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          mr.ropap@yandex.ru
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Поддержка</h3>
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  По всем вопросам, связанным с работой системы, обращайтесь к разработчику по указанным контактам.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Версия системы внизу */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">Версия системы</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Версия: 1.0.0 | Система управления KPI для сервиса "Сервис всем"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

