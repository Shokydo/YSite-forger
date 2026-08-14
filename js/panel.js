/* ===== SiteForge Panel - Панель настроек блоков ===== */

const PanelController = {
  _currentBlockId: null,

  /**
   * Показывает настройки для выбранного блока
   */
  showBlockSettings(blockId) {
    // Тот же блок — не пересобираем панель (иначе теряется фокус при печати и лагает)
    if (blockId === this._currentBlockId) return;
    this._currentBlockId = blockId;
    const block = Store.getBlockById(blockId);
    if (!block) {
      this.showGlobalSettings();
      return;
    }

    const blockSettings = document.getElementById('blockSettings');
    const globalSettings = document.getElementById('globalSettings');
    const panelTitle = document.getElementById('panelTitle');

    if (!blockSettings || !globalSettings) return;

    globalSettings.style.display = 'none';
    blockSettings.style.display = 'block';
    panelTitle.textContent = this._getBlockTitle(block);

    blockSettings.innerHTML = this._buildBlockSettingsHTML(block);
    this._bindBlockSettings(block);
  },

  /**
   * Показывает глобальные настройки
   */
  showGlobalSettings() {
    const blockSettings = document.getElementById('blockSettings');
    const globalSettings = document.getElementById('globalSettings');
    const panelTitle = document.getElementById('panelTitle');

    if (!blockSettings || !globalSettings) return;

    globalSettings.style.display = 'block';
    blockSettings.style.display = 'none';
    panelTitle.textContent = 'Настройки';
    
    // Синхронизируем глобальные настройки с состоянием
    this._syncGlobalSettings();
  },

  _getBlockTitle(block) {
    const names = {
      section: 'Секция',
      container: 'Контейнер',
      columns: 'Колонки',
      column: 'Колонка',
      heading: 'Заголовок',
      paragraph: 'Параграф',
      button: 'Кнопка',
      image: 'Изображение',
      divider: 'Разделитель',
      list: 'Список',
      gallery: 'Галерея',
      form: 'Форма',
      input: 'Поле ввода',
      textarea: 'Текстовое поле',
      nav: 'Навигация',
      'nav-link': 'Ссылка',
      'global-header': 'Header',
      'global-footer': 'Footer'
    };
    return names[block.type] || block.type;
  },

  _buildBlockSettingsHTML(block) {
    const type = block.type;
    
    let html = `
      <div class="block-setting-tabs">
        <button class="block-setting-tab active" data-tab="content">Контент</button>
        <button class="block-setting-tab" data-tab="styles">Стили</button>
      </div>
      <div class="block-setting-content active" id="bs-content">
    `;

    // Контент (зависит от типа блока)
    html += this._buildContentFields(block);

    html += `</div><div class="block-setting-content" id="bs-styles">`;

    // Стили (общие для всех блоков)
    html += this._buildStyleFields(block);

    html += `</div>`;

    return html;
  },

  _buildContentFields(block) {
    let html = '';
    const type = block.type;

    switch (type) {
      case 'heading':
        html += `<div class="settings-group">
          <label class="settings-label">Текст заголовка</label>
          <input type="text" id="field-content" value="${this._esc(block.content || '')}" data-field="content" />
        </div>
        <div class="settings-group">
          <label class="settings-label">Уровень</label>
          <select id="field-level" data-field="level">
            <option value="h1" ${block.level === 'h1' ? 'selected' : ''}>H1</option>
            <option value="h2" ${block.level === 'h2' ? 'selected' : ''}>H2</option>
            <option value="h3" ${block.level === 'h3' ? 'selected' : ''}>H3</option>
            <option value="h4" ${block.level === 'h4' ? 'selected' : ''}>H4</option>
            <option value="h5" ${block.level === 'h5' ? 'selected' : ''}>H5</option>
            <option value="h6" ${block.level === 'h6' ? 'selected' : ''}>H6</option>
          </select>
        </div>`;
        break;

      case 'paragraph':
        html += `<div class="settings-group">
          <label class="settings-label">Текст параграфа</label>
          <textarea id="field-content" data-field="content">${this._esc(block.content || '')}</textarea>
        </div>`;
        break;

      case 'button':
        html += `<div class="settings-group">
          <label class="settings-label">Текст кнопки</label>
          <input type="text" id="field-content" value="${this._esc(block.content || '')}" data-field="content" />
        </div>
        <div class="settings-group">
          <label class="settings-label">Ссылка (URL или #page)</label>
          <input type="text" id="field-href" value="${this._esc(block.href || '#')}" data-field="href" />
        </div>`;
        break;

      case 'image':
        html += `<div class="settings-group">
          <label class="settings-label">URL изображения</label>
          <input type="text" id="field-src" value="${this._esc(block.src || '')}" data-field="src" />
        </div>
        <div class="settings-group">
          <label class="settings-label">Alt текст</label>
          <input type="text" id="field-alt" value="${this._esc(block.alt || '')}" data-field="alt" />
        </div>
        <div class="settings-group">
          <label class="settings-label">Object-fit</label>
          <select id="field-objectFit" data-field="objectFit">
            <option value="cover" ${block.objectFit === 'cover' ? 'selected' : ''}>Cover</option>
            <option value="contain" ${block.objectFit === 'contain' ? 'selected' : ''}>Contain</option>
            <option value="fill" ${block.objectFit === 'fill' ? 'selected' : ''}>Fill</option>
          </select>
        </div>`;
        break;

      case 'list':
        const items = block.items || [''];
        html += `<div class="settings-group">
          <label class="settings-label">Тип списка</label>
          <select id="field-listType" data-field="listType">
            <option value="unordered" ${block.listType === 'unordered' ? 'selected' : ''}>Маркированный</option>
            <option value="ordered" ${block.listType === 'ordered' ? 'selected' : ''}>Нумерованный</option>
          </select>
        </div>
        <div class="settings-group">
          <label class="settings-label">Элементы списка</label>`;
        items.forEach((item, i) => {
          html += `<input type="text" class="list-item-field" value="${this._esc(item)}" data-index="${i}" style="margin-bottom:4px;" placeholder="Элемент ${i+1}" />`;
        });
        html += `<button class="btn btn-icon" id="addListItemBtn" style="margin-top:4px;width:100%;justify-content:center;font-size:12px;">+ Добавить</button>
        </div>`;
        break;

      case 'gallery':
        const images = block.images || [''];
        html += `<div class="settings-group">
          <label class="settings-label">Кол-во колонок</label>
          <input type="number" id="field-columns" value="${block.columns || 3}" min="1" max="6" data-field="columns" />
        </div>
        <div class="settings-group">
          <label class="settings-label">URL изображений</label>`;
        images.forEach((img, i) => {
          html += `<input type="text" class="gallery-image-field" value="${this._esc(img)}" data-index="${i}" style="margin-bottom:4px;" placeholder="URL изображения ${i+1}" />`;
        });
        html += `<button class="btn btn-icon" id="addGalleryImageBtn" style="margin-top:4px;width:100%;justify-content:center;font-size:12px;">+ Добавить</button>
        </div>`;
        break;

      case 'form':
        html += `<div class="settings-group">
          <label class="settings-label">Действие при отправке</label>
          <select id="field-formAction" data-field="formAction">
            <option value="message" ${block.formAction === 'message' ? 'selected' : ''}>Показать сообщение</option>
            <option value="download" ${block.formAction === 'download' ? 'selected' : ''}>Скачать JSON</option>
            <option value="mailto" ${block.formAction === 'mailto' ? 'selected' : ''}>Открыть почту</option>
          </select>
        </div>`;
        break;

      case 'nav-link':
        html += `<div class="settings-group">
          <label class="settings-label">Текст ссылки</label>
          <input type="text" id="field-content" value="${this._esc(block.content || '')}" data-field="content" />
        </div>
        <div class="settings-group">
          <label class="settings-label">href</label>
          <input type="text" id="field-href" value="${this._esc(block.href || '#')}" data-field="href" />
        </div>`;
        break;

      case 'section':
        html += `<div class="settings-group">
          <label class="settings-label">Фон секции (BG·LAB)</label>
          <div class="bgpicker-block"></div>
        </div>`;
        break;

      default:
        html += `<div class="settings-group">
          <label class="settings-label">Контент</label>
          <textarea id="field-content" data-field="content">${this._esc(block.content || '')}</textarea>
        </div>`;
    }

    return html;
  },

  _buildStyleFields(block) {
    const s = block.styles || {};
    return `
      <div class="settings-group">
        <label class="settings-label">Типографика</label>
        <div class="setting-row">
          <label>Размер шрифта</label>
          <input type="text" value="${this._esc(s.fontSize || '')}" data-style="fontSize" placeholder="16px" />
        </div>
        <div class="setting-row">
          <label>Жирность</label>
          <input type="text" value="${this._esc(s.fontWeight || '')}" data-style="fontWeight" placeholder="400" />
        </div>
        <div class="setting-row">
          <label>Цвет текста</label>
          <input type="color" value="${this._cssColorToHex(s.color || '#f5f5f5')}" data-style="color" />
        </div>
        <div class="setting-row">
          <label>Выравнивание</label>
          <select data-style="textAlign">
            <option value="" ${!s.textAlign ? 'selected' : ''}>По умолчанию</option>
            <option value="left" ${s.textAlign === 'left' ? 'selected' : ''}>Слева</option>
            <option value="center" ${s.textAlign === 'center' ? 'selected' : ''}>По центру</option>
            <option value="right" ${s.textAlign === 'right' ? 'selected' : ''}>Справа</option>
          </select>
        </div>
        <div class="setting-row">
          <label>Межстрочный</label>
          <input type="text" value="${this._esc(s.lineHeight || '')}" data-style="lineHeight" placeholder="1.6" />
        </div>
      </div>
      <div class="settings-group">
        <label class="settings-label">Фон</label>
        <div class="setting-row">
          <label>Цвет фона</label>
          <input type="color" value="${this._cssColorToHex(s.background || '#0d0d0d')}" data-style="background" />
        </div>
      </div>
      <div class="settings-group">
        <label class="settings-label">Отступы</label>
        <div class="setting-row">
          <label>Padding</label>
          <input type="text" value="${this._esc(s.padding || '')}" data-style="padding" placeholder="16px" />
        </div>
        <div class="setting-row">
          <label>Margin</label>
          <input type="text" value="${this._esc(s.margin || '')}" data-style="margin" placeholder="0" />
        </div>
      </div>
      <div class="settings-group">
        <label class="settings-label">Границы</label>
        <div class="setting-row">
          <label>Border-radius</label>
          <input type="text" value="${this._esc(s.borderRadius || '')}" data-style="borderRadius" placeholder="8px" />
        </div>
        <div class="setting-row">
          <label>Border</label>
          <input type="text" value="${this._esc(s.border || '')}" data-style="border" placeholder="1px solid #2a2a2a" />
        </div>
      </div>
      <div class="settings-group">
        <label class="settings-label">Дополнительно</label>
        <div class="setting-row">
          <label>Ширина</label>
          <input type="text" value="${this._esc(s.width || '')}" data-style="width" placeholder="auto" />
        </div>
        <div class="setting-row">
          <label>Макс. ширина</label>
          <input type="text" value="${this._esc(s.maxWidth || '')}" data-style="maxWidth" placeholder="1100px" />
        </div>
        <div class="setting-row">
          <label>Прозрачность</label>
          <input type="text" value="${this._esc(s.opacity || '')}" data-style="opacity" placeholder="1" />
        </div>
      </div>
    `;
  },

  _bindBlockSettings(block) {
    const container = document.getElementById('blockSettings');
    if (!container) return;

    // Табы
    container.querySelectorAll('.block-setting-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.block-setting-tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.block-setting-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        const content = tabName === 'content' ? 'bs-content' : 'bs-styles';
        document.getElementById(content)?.classList.add('active');
      });
    });

    // Поля контента
    container.querySelectorAll('[data-field]').forEach(field => {
      const fieldName = field.dataset.field;
      field.addEventListener('change', () => {
        const value = field.type === 'checkbox' ? field.checked : field.value;
        Store.updateBlock(block.id, { [fieldName]: value });
      });
      field.addEventListener('input', () => {
        const value = field.type === 'checkbox' ? field.checked : field.value;
        Store.updateBlock(block.id, { [fieldName]: value });
      });
    });

    // Поля стилей
    container.querySelectorAll('[data-style]').forEach(field => {
      const styleName = field.dataset.style;
      field.addEventListener('change', () => {
        const styles = { ...(Store.getBlockById(block.id)?.styles || {}), [styleName]: field.value };
        Store.updateBlock(block.id, { styles });
      });
      field.addEventListener('input', () => {
        const styles = { ...(Store.getBlockById(block.id)?.styles || {}), [styleName]: field.value };
        Store.updateBlock(block.id, { styles });
      });
    });

    // Список: добавление элемента
    const addListItemBtn = document.getElementById('addListItemBtn');
    if (addListItemBtn) {
      addListItemBtn.addEventListener('click', () => {
        const currentBlock = Store.getBlockById(block.id);
        const items = [...(currentBlock?.items || []), ''];
        Store.updateBlock(block.id, { items });
      });
    }

    // Список: изменение элемента
    container.querySelectorAll('.list-item-field').forEach(field => {
      field.addEventListener('change', () => {
        const currentBlock = Store.getBlockById(block.id);
        const items = [...(currentBlock?.items || [])];
        items[parseInt(field.dataset.index)] = field.value;
        Store.updateBlock(block.id, { items });
      });
    });

    // Галерея: добавление изображения
    const addGalleryBtn = document.getElementById('addGalleryImageBtn');
    if (addGalleryBtn) {
      addGalleryBtn.addEventListener('click', () => {
        const currentBlock = Store.getBlockById(block.id);
        const images = [...(currentBlock?.images || []), ''];
        Store.updateBlock(block.id, { images });
      });
    }

    // Галерея: изменение URL
    container.querySelectorAll('.gallery-image-field').forEach(field => {
      field.addEventListener('change', () => {
        const currentBlock = Store.getBlockById(block.id);
        const images = [...(currentBlock?.images || [])];
        images[parseInt(field.dataset.index)] = field.value;
        Store.updateBlock(block.id, { images });
      });
    });

    // Фон секции (BG·LAB)
    const bgPickerBlock = container.querySelector('.bgpicker-block');
    if (bgPickerBlock && block.type === 'section') {
      const selectedId = block.bgEmbed?.bgId || null;
      bgPickerBlock.innerHTML = this._bgPickerHTML(selectedId);
      this._fillBgThumbs(bgPickerBlock);

      bgPickerBlock.querySelectorAll('[data-bg-id]').forEach(item => {
        item.addEventListener('click', () => {
          const bgId = item.dataset.bgId === '__none__' ? null : item.dataset.bgId;
          Store.setBlockBgEmbed(block.id, bgId);
          bgPickerBlock.querySelectorAll('[data-bg-id]').forEach(i => {
            i.classList.toggle('sel', i.dataset.bgId === (bgId || '__none__'));
          });
        });
      });

      const goBgLab = bgPickerBlock.querySelector('[data-goto-bglab]');
      if (goBgLab) goBgLab.addEventListener('click', () => { if (window.AppController) AppController.openBgLab(); });
    }
  },

  /* ---------- BG·LAB пикеры ---------- */

  /**
   * Позволяет выбрать сохранённый фон для текущей страницы
   */
  renderPageBgPicker() {
    const container = document.getElementById('pageBgPicker');
    if (!container) return;
    const page = Store.getCurrentPage();
    const selectedId = page?.background?.bgId || null;
    container.innerHTML = this._bgPickerHTML(selectedId);
    this._fillBgThumbs(container);

    container.querySelectorAll('[data-bg-id]').forEach(item => {
      item.addEventListener('click', () => {
        const bgId = item.dataset.bgId === '__none__' ? null : item.dataset.bgId;
        const currentPage = Store.getCurrentPage();
        if (currentPage) Store.setPageBackground(currentPage.id, bgId);
        container.querySelectorAll('[data-bg-id]').forEach(i => {
          i.classList.toggle('sel', i.dataset.bgId === (bgId || '__none__'));
        });
      });
    });

    const goBgLab = container.querySelector('[data-goto-bglab]');
    if (goBgLab) goBgLab.addEventListener('click', () => { if (window.AppController) AppController.openBgLab(); });
  },

  _bgPickerHTML(selectedId) {
    const all = BackgroundsLib.getAll();
    let html = `<div class="bgpicker-grid">`;
    html += `<div class="bgpicker-item ${!selectedId ? 'sel' : ''}" data-bg-id="__none__" title="Без фона">
      <div class="bgpicker-thumb bgpicker-none"><span>✕</span></div>
      <div class="bgpicker-name">Без фона</div>
    </div>`;
    all.forEach(b => {
      html += `<div class="bgpicker-item ${b.id === selectedId ? 'sel' : ''}" data-bg-id="${b.id}" title="${this._esc(b.name)}">
        <div class="bgpicker-thumb" data-thumb="${b.id}"></div>
        <div class="bgpicker-name">${this._esc(b.name)}</div>
      </div>`;
    });
    html += `</div>`;
    html += `<button class="btn btn-icon" data-goto-bglab style="width:100%;justify-content:center;font-size:12px;margin-top:8px;">Открыть BG·LAB</button>`;
    return html;
  },

  _fillBgThumbs(container) {
    container.querySelectorAll('[data-thumb]').forEach(thumb => {
      const id = thumb.dataset.thumb;
      const bg = BackgroundsLib.get(id);
      if (bg) {
        try { show(thumb, bg.state, 't' + id.replace(/[^a-zA-Z0-9]/g, '')); } catch (e) { console.error(e); }
      }
    });
  },

  _syncGlobalSettings() {
    const state = Store.getState();
    const colors = state.globalSettings?.colors;
    const fonts = state.globalSettings?.fonts;

    const colorPrimary = document.getElementById('colorPrimary');
    const colorBackground = document.getElementById('colorBackground');
    const colorText = document.getElementById('colorText');
    const fontFamily = document.getElementById('fontFamily');

    if (colorPrimary && colors) colorPrimary.value = this._cssColorToHex(colors.primary || '#ffffff');
    if (colorBackground && colors) colorBackground.value = this._cssColorToHex(colors.background || '#0d0d0d');
    if (colorText && colors) colorText.value = this._cssColorToHex(colors.text || '#f5f5f5');
    if (fontFamily && fonts) fontFamily.value = fonts.primary || 'Inter, sans-serif';

    // Режим проекта
    const mode = window.__editorMode || 'html';
    const setHtml = document.getElementById('setHtmlMode');
    const setZip = document.getElementById('setZipMode');
    if (setHtml) setHtml.classList.toggle('active', mode === 'html');
    if (setZip) setZip.classList.toggle('active', mode === 'zip');

    // Пинер фона страницы
    this.renderPageBgPicker();
  },

  _bindGlobalSettings() {
    const colorPrimary = document.getElementById('colorPrimary');
    const colorBackground = document.getElementById('colorBackground');
    const colorText = document.getElementById('colorText');
    const fontFamily = document.getElementById('fontFamily');

    const updateColors = () => {
      const state = Store.getState();
      state.globalSettings.colors = {
        primary: colorPrimary?.value || '#ffffff',
        background: colorBackground?.value || '#0d0d0d',
        text: colorText?.value || '#f5f5f5'
      };
      state.globalSettings.fonts = {
        primary: fontFamily?.value || 'Inter, sans-serif',
        fallback: 'sans-serif'
      };
      Store._notify();
    };

    if (colorPrimary) colorPrimary.addEventListener('input', updateColors);
    if (colorBackground) colorBackground.addEventListener('input', updateColors);
    if (colorText) colorText.addEventListener('input', updateColors);
    if (fontFamily) fontFamily.addEventListener('change', updateColors);

    // Кнопки режима проекта
    const setHtml = document.getElementById('setHtmlMode');
    const setZip = document.getElementById('setZipMode');
    if (setHtml) setHtml.addEventListener('click', () => { if (window.AppController) AppController.setEditorMode('html'); });
    if (setZip) setZip.addEventListener('click', () => { if (window.AppController) AppController.setEditorMode('zip'); });
  },

  /**
   * Конвертирует CSS цвет (#xxx, rgb, named) в hex
   */
  _cssColorToHex(color) {
    if (!color) return '#ffffff';
    
    // Если уже hex
    if (color.startsWith('#')) {
      return color.length === 4 
        ? '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
        : color;
    }

    // Если gradient или другое сложное значение
    if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
      return '#ffffff';
    }

    // Пробуем создать временный элемент для парсинга
    try {
      const temp = document.createElement('div');
      temp.style.color = color;
      document.body.appendChild(temp);
      const computed = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      
      // RGB to Hex
      const match = computed.match(/\d+/g);
      if (match) {
        const r = parseInt(match[0]).toString(16).padStart(2, '0');
        const g = parseInt(match[1]).toString(16).padStart(2, '0');
        const b = parseInt(match[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    } catch(e) {}

    return '#ffffff';
  },

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};

