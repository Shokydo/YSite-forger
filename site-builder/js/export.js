/* ===== SiteForge Export - Система экспорта ===== */

const ExportController = {
  _selectedExportType: 'html', // 'html' | 'zip'

  /**
   * Инициализация
   */
  init() {
    this._bindEvents();
  },

  /**
   * Привязка событий
   */
  _bindEvents() {
    // Кнопка экспорта HTML
    document.getElementById('exportHtmlBtn')?.addEventListener('click', () => {
      this._selectedExportType = 'html';
      this._showExportModal('html');
    });

    // Кнопка экспорта ZIP
    document.getElementById('exportZipBtn')?.addEventListener('click', () => {
      this._selectedExportType = 'zip';
      this._showExportModal('zip');
    });

    // Выбор опции экспорта
    document.querySelectorAll('.export-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.export-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    // Кнопка "Экспортировать" в модалке
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      this._executeExport();
    });
  },

  /**
   * Показать модальное окно экспорта
   */
  _showExportModal(type) {
    const modal = document.getElementById('exportModal');
    if (!modal) return;

    modal.style.display = 'flex';
    
    // Подсвечиваем выбранную опцию
    document.querySelectorAll('.export-option').forEach(o => o.classList.remove('selected'));
    if (type === 'html') {
      document.getElementById('exportOptionHtml')?.classList.add('selected');
    } else {
      document.getElementById('exportOptionZip')?.classList.add('selected');
    }

    // Скрываем прогресс
    document.getElementById('exportProgress').style.display = 'none';
    document.getElementById('exportBtn').textContent = 'Экспортировать';
  },

  /**
   * Выполнить экспорт
   */
  async _executeExport() {
    const state = Store.getState();
    const selectedOption = document.querySelector('.export-option.selected');
    const isHtml = selectedOption?.id === 'exportOptionHtml' || this._selectedExportType === 'html';
    
    const options = {
      minify: document.getElementById('optMinify')?.checked || false,
      inlineBase64: document.getElementById('optBase64')?.checked || true,
      webp: document.getElementById('optWebp')?.checked || true
    };

    // Показываем прогресс
    document.getElementById('exportProgress').style.display = 'block';
    document.getElementById('exportBtn').textContent = 'Генерация...';
    document.getElementById('progressFill').style.width = '30%';
    document.getElementById('progressText').textContent = 'Генерация проекта...';

    try {
      if (isHtml) {
        await this._exportSingleHTML(state, options);
      } else {
        await this._exportZip(state, options);
      }

      document.getElementById('progressFill').style.width = '100%';
      document.getElementById('progressText').textContent = 'Готово!';
      
      setTimeout(() => {
        this._closeModal();
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      document.getElementById('progressText').textContent = 'Ошибка при экспорте: ' + error.message;
      document.getElementById('progressFill').style.width = '0%';
      document.getElementById('exportBtn').textContent = 'Повторить';
    }
  },

  /**
   * Экспорт в Single HTML
   */
  async _exportSingleHTML(state, options) {
    document.getElementById('progressText').textContent = 'Генерация HTML...';
    document.getElementById('progressFill').style.width = '50%';
    
    // Небольшая задержка для имитации прогресса
    await this._sleep(200);

    const html = Renderer.generateFullHTML(state, options);
    
    document.getElementById('progressText').textContent = 'Создание файла...';
    document.getElementById('progressFill').style.width = '80%';
    
    await this._sleep(100);

    // Скачиваем файл
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = this._sanitizeFilename(state.projectName || 'my-site') + '.html';
    this._downloadFile(blob, filename);
  },

  /**
   * Экспорт в ZIP архив
   */
  async _exportZip(state, options) {
    if (typeof JSZip === 'undefined') {
      throw new Error('Библиотека JSZip не загружена. Проверьте подключение.');
    }

    document.getElementById('progressText').textContent = 'Сборка проекта...';
    document.getElementById('progressFill').style.width = '30%';

    const zip = new JSZip();
    const projectName = this._sanitizeFilename(state.projectName || 'my-site');
    const root = zip.folder(projectName);

    // Генерируем HTML
    document.getElementById('progressText').textContent = 'Генерация HTML...';
    document.getElementById('progressFill').style.width = '40%';
    
    const html = Renderer.generateFullHTML(state, { ...options, minify: false });
    root.file('index.html', html);

    // Генерируем CSS
    document.getElementById('progressText').textContent = 'Генерация CSS...';
    document.getElementById('progressFill').style.width = '50%';
    
    const css = Renderer.generateCSS(state);
    const cssFolder = root.folder('css');
    cssFolder.file('style.css', css);

    // Генерируем JS
    document.getElementById('progressText').textContent = 'Генерация JavaScript...';
    document.getElementById('progressFill').style.width = '60%';
    
    const js = Renderer.generateJS(state);
    const jsFolder = root.folder('js');
    jsFolder.file('main.js', js);

    // README
    document.getElementById('progressText').textContent = 'Создание README...';
    document.getElementById('progressFill').style.width = '70%';
    
    root.file('README.md', `# ${state.projectName || 'Мой проект'}

Сайт создан с помощью YSiteForger - визуального конструктора сайтов.

## Развертывание

1. Загрузите все файлы на ваш хостинг
2. Убедитесь, что файл index.html находится в корневой директории
3. Откройте сайт через index.html

## Структура проекта

- \`index.html\` - Главная страница
- \`css/style.css\` - Стили
- \`js/main.js\` - JavaScript (навигация, формы)
- \`images/\` - Изображения (если есть)
- \`fonts/\` - Шрифты (если есть)

## Особенности

- ✅ Полностью автономный - работает без интернета
- ✅ Многостраничный - все страницы в одном файле
- ✅ Адаптивный дизайн
- ✅ Работает на любом хостинге

---

Сгенерировано YSiteForger
`);

    // Генерируем архив
    document.getElementById('progressText').textContent = 'Архивация...';
    document.getElementById('progressFill').style.width = '85%';
    
    await this._sleep(200);

    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    }, (metadata) => {
      const progress = 85 + (metadata.percent / 100) * 15;
      document.getElementById('progressFill').style.width = progress + '%';
    });

    const filename = projectName + '.zip';
    this._downloadFile(content, filename);
  },

  /**
   * Скачать файл
   */
  _downloadFile(blob, filename) {
    if (typeof saveAs === 'function') {
      saveAs(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },

  /**
   * Санитизация имени файла
   */
  _sanitizeFilename(name) {
    return name
      .replace(/[^a-zA-Zа-яА-Я0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50) || 'my-site';
  },

  /**
   * Закрыть модалку
   */
  _closeModal() {
    document.getElementById('exportModal').style.display = 'none';
  },

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Делаем функцию закрытия модалки глобальной
function closeExportModal() {
  document.getElementById('exportModal').style.display = 'none';
}
