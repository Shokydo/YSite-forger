/* ===== SiteForge App - Инициализация и контроллер ===== */

const StoreController = {
  /**
   * Инициализация приложения
   */
  init() {
    // Инициализируем все модули
    PagesController.init();
    DragDrop.init();
    ExportController.init();
    PanelController._bindGlobalSettings();
    if (window.AppController) AppController.init();

    // Первый рендер
    this._render();

    // Подписываемся на изменения стора
    Store.subscribe(() => this._scheduleRender());

    // Привязываем UI события
    this._bindUIEvents();
  },

  _renderTimer: 0,
  _scheduleRender() {
    clearTimeout(this._renderTimer);
    this._renderTimer = setTimeout(() => {
      this._renderTimer = 0;
      this._render();
    }, 40);
  },

  /**
   * Рендер канваса и обновление UI
   */
  _render() {
    const state = Store.getState();
    
    // Рендерим канвас
    this._renderCanvas(state);
    
    // Обновляем индикатор страницы
    this._updatePageIndicator(state);
    
    // Обновляем состояние кнопок undo/redo
    this._updateUndoRedoButtons();
    
    // Обновляем панель настроек
    this._updateSettingsPanel(state);
    
    // Обновляем режим просмотра
    this._updateViewMode(state);
  },

  /**
   * Рендер канваса
   */
  _renderCanvas(state) {
    const canvasPage = document.getElementById('canvasPage');
    if (!canvasPage) return;

    // Применяем класс режима просмотра
    canvasPage.className = 'canvas-page ' + (state.viewMode || 'desktop');

    // Фон страницы (BG·LAB)
    const page = state.pages.find(p => p.id === state.currentPageId);
    const pageBg = page?.background?.bgId ? BackgroundsLib.get(page.background.bgId) : null;

    canvasPage.innerHTML = (pageBg
      ? '<div class="canvas-bg">' + BackgroundsLib.svgFor(pageBg.state, 'c' + String(page.id).replace(/[^a-zA-Z0-9_]/g, '')) + '</div>'
      : '')
      + '<div class="canvas-content">' + Renderer.renderCanvas(state) + '</div>';

    // Курсор-FX для фонов
    BackgroundsLib.bindCursorOn(canvasPage);

    // Обновляем drop zone, если она появилась
    this._refreshDropZone();
  },

  /**
   * Обновляем drop zone
   */
  _refreshDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      // Удаляем старый обработчик, если есть
      const newDropZone = dropZone.cloneNode(true);
      dropZone.parentNode?.replaceChild(newDropZone, dropZone);
      
      // Добавляем обработчики для дропа
      newDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        newDropZone.classList.add('dragover');
      });
      newDropZone.addEventListener('dragleave', () => {
        newDropZone.classList.remove('dragover');
      });
      newDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        newDropZone.classList.remove('dragover');
        
        const blockType = e.dataTransfer.getData('text/plain');
        if (blockType) {
          const newBlock = BlocksLibrary.create(blockType);
          Store.addBlock(newBlock);
        }
      });
    }
  },

  /**
   * Обновить индикатор текущей страницы
   */
  _updatePageIndicator(state) {
    const indicator = document.getElementById('currentPageName');
    const page = state.pages.find(p => p.id === state.currentPageId);
    if (indicator && page) {
      indicator.textContent = page.name;
    }
  },

  /**
   * Обновить кнопки Undo/Redo
   */
  _updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = !Store.canUndo();
    if (redoBtn) redoBtn.disabled = !Store.canRedo();
  },

  /**
   * Обновить панель настроек
   */
  _updateSettingsPanel(state) {
    if (state.selectedBlockId) {
      PanelController.showBlockSettings(state.selectedBlockId);
    } else {
      PanelController.showGlobalSettings();
    }
  },

  /**
   * Обновить режим просмотра
   */
  _updateViewMode(state) {
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === state.viewMode);
    });
  },

  /**
   * Привязка событий UI
   */
  _bindUIEvents() {
    // Undo
    document.getElementById('undoBtn')?.addEventListener('click', () => {
      Store.undo();
    });

    // Redo
    document.getElementById('redoBtn')?.addEventListener('click', () => {
      Store.redo();
    });

    // Сочетания клавиш
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        Store.undo();
      }
      // Ctrl+Shift+Z - Redo
      if (e.ctrlKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        Store.redo();
      }
      // Delete/Backspace - удалить выбранный блок
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('input, textarea, select')) {
        const state = Store.getState();
        if (state.selectedBlockId) {
          e.preventDefault();
          this.removeBlock(state.selectedBlockId);
        }
      }
      // Escape - снять выделение
      if (e.key === 'Escape') {
        Store.selectBlock(null);
      }
    });

    // Переключение режимов просмотра
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.setViewMode(btn.dataset.view);
      });
    });

    // Имя проекта
    document.getElementById('projectName')?.addEventListener('change', (e) => {
      const state = Store.getState();
      state.projectName = e.target.value;
      Store._notify();
    });

    // Выбор блока на канвасе (через делегирование)
    document.getElementById('canvasPage')?.addEventListener('click', (e) => {
      const wrapper = e.target.closest('.block-wrapper');
      if (wrapper) {
        Store.selectBlock(wrapper.dataset.blockId);
        e.stopPropagation();
      } else {
        Store.selectBlock(null);
      }
    });

    // Двойной клик для редактирования текста
    document.getElementById('canvasPage')?.addEventListener('dblclick', async (e) => {
      const heading = e.target.closest('.rendered-heading');
      const paragraph = e.target.closest('.rendered-paragraph');
      const textEl = heading || paragraph;
      
      if (textEl) {
        const blockId = textEl.closest('[data-block-id]')?.dataset.blockId;
        if (blockId) {
          const currentText = textEl.textContent;
          const newText = await Dialogs.prompt('Редактировать текст:', currentText);
          if (newText !== null && newText.trim()) {
            Store.updateBlock(blockId, { content: newText.trim() });
          }
        }
      }
    });

    // Экспорт нажатием Enter в поле имени проекта
    document.getElementById('projectName')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.target.blur();
    });

    // Поиск блоков
    document.getElementById('blockSearch')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.block-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
      });
    });

    // Переключение вкладок в левой панели
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const contentId = tab.dataset.tab === 'blocks' ? 'tabBlocks' : 'tabPages';
        document.getElementById(contentId)?.classList.add('active');
      });
    });
  },

  // --- Действия, вызываемые из HTML ---

  /**
   * Удалить блок
   */
  removeBlock(blockId) {
    Store.removeBlock(blockId);
  },

  /**
   * Переместить блок
   */
  moveBlock(blockId, direction) {
    const state = Store.getState();
    const page = state.pages.find(p => p.id === state.currentPageId);
    if (!page) return;

    // Находим индекс блока
    const findIndex = (blocks, id) => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === id) return i;
        if (blocks[i].children) {
          const idx = findIndex(blocks[i].children, id);
          if (idx !== -1) return idx;
        }
      }
      return -1;
    };

    const currentIndex = findIndex(page.blocks, blockId);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= page.blocks.length) return;

    // Меняем местами
    const blocks = page.blocks;
    [blocks[currentIndex], blocks[newIndex]] = [blocks[newIndex], blocks[currentIndex]];
    
    Store._saveToHistory();
    Store._notify();
  }
};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  StoreController.init();
});
