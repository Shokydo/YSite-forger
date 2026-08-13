/* ===== SiteForge Pages - Управление виртуальными страницами ===== */

const PagesController = {
  _pagesList: null,

  /**
   * Инициализация
   */
  init() {
    this._pagesList = document.getElementById('pagesList');
    this._bindEvents();
    this.render();
  },

  /**
   * Отрисовка списка страниц
   */
  render() {
    if (!this._pagesList) return;
    const state = Store.getState();
    
    this._pagesList.innerHTML = state.pages.map((page, index) => {
      const isActive = page.id === state.currentPageId;
      return `
        <div class="page-item ${isActive ? 'active' : ''}" data-page-id="${page.id}">
          <div class="page-item-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span class="page-item-name">${this._esc(page.name)}</span>
          <div class="page-item-actions">
            <button class="btn-icon" onclick="event.stopPropagation(); PagesController.renamePage('${page.id}')" title="Переименовать">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon" onclick="event.stopPropagation(); PagesController.removePage('${page.id}')" title="Удалить страницу">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Привязка событий
   */
  _bindEvents() {
    // Клик по странице
    this._pagesList?.addEventListener('click', (e) => {
      const item = e.target.closest('.page-item');
      if (item && !e.target.closest('.btn-icon')) {
        const pageId = item.dataset.pageId;
        if (pageId) {
          Store.setCurrentPage(pageId);
        }
      }
    });

    // Добавление страницы
    document.getElementById('addPageBtn')?.addEventListener('click', () => {
      const name = prompt('Введите название новой страницы:', 'Новая страница');
      if (name && name.trim()) {
        Store.addPage(name.trim());
      }
    });

    // Клик по глобальным секциям (Header/Footer) - показываем в настройках
    document.querySelectorAll('.global-section').forEach(section => {
      section.addEventListener('click', () => {
        const sectionType = section.dataset.section; // 'header' | 'footer'
        const state = Store.getState();
        const globalSection = state.globalSections?.[sectionType];
        if (globalSection) {
          Store.selectBlock(globalSection.id);
        }
      });
    });

    // Подписка на изменения
    Store.subscribe(() => this.render());
  },

  /**
   * Переименовать страницу
   */
  renamePage(pageId) {
    const state = Store.getState();
    const page = state.pages.find(p => p.id === pageId);
    if (!page) return;

    const newName = prompt('Введите новое название страницы:', page.name);
    if (newName && newName.trim()) {
      Store.renamePage(pageId, newName.trim());
    }
  },

  /**
   * Удалить страницу
   */
  removePage(pageId) {
    const state = Store.getState();
    if (state.pages.length <= 1) {
      alert('Нельзя удалить последнюю страницу.');
      return;
    }
    if (confirm('Удалить эту страницу?')) {
      Store.removePage(pageId);
    }
  },

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};

