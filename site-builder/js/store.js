/* ===== SiteForge Store - Управление состоянием (JSON AST) ===== */

const Store = {
  _state: null,
  _listeners: [],
  _history: [],
  _historyIndex: -1,
  _maxHistory: 50,
  _storageKey: 'siteforge_project_v1',
  _autosaveTimer: null,

  /**
   * Инициализация хранилища (восстанавливает сохранённый проект)
   */
  init() {
    const saved = this._loadSaved();
    this._state = saved ? saved : this._getDefaultState();
    this._saveToHistory();
    this._notify();
  },

  _loadSaved() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.pages)) return null;
      return data;
    } catch (e) {
      return null;
    }
  },

  _scheduleAutosave() {
    if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
    this._autosaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(this._storageKey, JSON.stringify(this._state));
      } catch (e) {
        console.warn('Store: не удалось автосохранить проект', e);
      }
    }, 400);
  },

  /**
   * Сброс проекта к начальному состоянию
   */
  reset() {
    try { localStorage.removeItem(this._storageKey); } catch (e) {}
    this._state = this._getDefaultState();
    this._history = [];
    this._historyIndex = -1;
    this._saveToHistory();
    this._notify();
  },
  
  /**
   * Состояние по умолчанию
   */
  _getDefaultState() {
    return {
      projectId: 'proj_' + Date.now(),
      projectName: 'Мой проект',
      globalSettings: {
        fonts: {
          primary: 'Inter, sans-serif',
          fallback: 'sans-serif'
        },
        colors: {
          primary: '#ffffff',
          background: '#0d0d0d',
          text: '#f5f5f5'
        }
      },
      globalSections: {
        header: {
          type: 'global-header',
          id: 'global-header',
          styles: {
            padding: '16px 20px',
            background: '#111111',
            borderBottom: '1px solid #2a2a2a'
          },
          children: [
            {
              type: 'container',
              id: 'header-container',
              styles: {
                maxWidth: '1100px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              },
              children: [
                {
                  type: 'heading',
                  id: 'header-logo',
                  content: 'Мой сайт',
                  styles: {
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#ffffff',
                    margin: '0'
                  }
                },
                {
                  type: 'nav',
                  id: 'header-nav',
                  styles: {
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'center'
                  },
                  children: [
                    {
                      type: 'nav-link',
                      id: 'nav-home',
                      content: 'Главная',
                      href: '#home'
                    },
                    {
                      type: 'nav-link',
                      id: 'nav-services',
                      content: 'Услуги',
                      href: '#services'
                    },
                    {
                      type: 'nav-link',
                      id: 'nav-contacts',
                      content: 'Контакты',
                      href: '#contacts'
                    }
                  ]
                }
              ]
            }
          ]
        },
        footer: {
          type: 'global-footer',
          id: 'global-footer',
          styles: {
            padding: '32px 20px',
            background: '#0a0a0a',
            color: '#f5f5f5',
            textAlign: 'center'
          },
          children: [
            {
              type: 'paragraph',
              id: 'footer-text',
              content: '© 2024 Мой сайт. Все права защищены.',
              styles: {
                color: '#888888',
                fontSize: '14px',
                margin: '0'
              }
            }
          ]
        }
      },
      pages: [
        {
          id: 'page_home',
          slug: 'home',
          name: 'Главная',
          seo: {
            title: 'Главная - Мой сайт',
            description: 'Добро пожаловать на наш сайт'
          },
          background: { bgId: null },
          blocks: [
            {
              type: 'section',
              id: 'section-hero',
              styles: {
                padding: '80px 20px',
                background: '#161616',
                color: '#ffffff',
                textAlign: 'center'
              },
              children: [
                {
                  type: 'container',
                  id: 'hero-container',
                  styles: {
                    maxWidth: '800px',
                    margin: '0 auto'
                  },
                  children: [
                    {
                      type: 'heading',
                      id: 'hero-title',
                      content: 'Добро пожаловать!',
                      styles: {
                        fontSize: '48px',
                        fontWeight: '700',
                        margin: '0 0 16px 0',
                        color: '#ffffff'
                      }
                    },
                    {
                      type: 'paragraph',
                      id: 'hero-desc',
                      content: 'Мы создаем современные веб-решения для вашего бизнеса. Начните свой путь с нами.',
                      styles: {
                        fontSize: '18px',
                        lineHeight: '1.6',
                        margin: '0 0 32px 0',
                        opacity: '0.9'
                      }
                    },
                    {
                      type: 'button',
                      id: 'hero-btn',
                      content: 'Начать',
                      href: '#services',
                      styles: {
                        padding: '14px 36px',
                        background: '#ffffff',
                        color: '#0d0d0d',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }
                    }
                  ]
                }
              ]
            },
            {
              type: 'section',
              id: 'section-features',
              styles: {
                padding: '60px 20px',
                background: '#0d0d0d'
              },
              children: [
                {
                  type: 'container',
                  id: 'features-container',
                  styles: {
                    maxWidth: '1100px',
                    margin: '0 auto'
                  },
                  children: [
                    {
                      type: 'heading',
                      id: 'features-title',
                      content: 'Наши преимущества',
                      styles: {
                        fontSize: '36px',
                        fontWeight: '700',
                        textAlign: 'center',
                        color: '#f5f5f5',
                        margin: '0 0 40px 0'
                      }
                    },
                    {
                      type: 'columns',
                      id: 'features-columns',
                      styles: {
                        display: 'flex',
                        gap: '24px'
                      },
                      children: [
                        {
                          type: 'column',
                          id: 'feature-1',
                          styles: {
                            flex: '1',
                            padding: '24px',
                            background: '#1a1a1a',
                            borderRadius: '12px',
                            textAlign: 'center'
                          },
                          children: [
                            {
                              type: 'heading',
                              id: 'f1-title',
                              content: '⚡ Быстро',
                              styles: { fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }
                            },
                            {
                              type: 'paragraph',
                              id: 'f1-desc',
                              content: 'Создавайте сайты за минуты, а не дни. Интуитивный интерфейс без кода.',
                              styles: { fontSize: '14px', lineHeight: '1.6', margin: '0', color: '#aaaaaa' }
                            }
                          ]
                        },
                        {
                          type: 'column',
                          id: 'feature-2',
                          styles: {
                            flex: '1',
                            padding: '24px',
                            background: '#1a1a1a',
                            borderRadius: '12px',
                            textAlign: 'center'
                          },
                          children: [
                            {
                              type: 'heading',
                              id: 'f2-title',
                              content: '🎨 Красиво',
                              styles: { fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }
                            },
                            {
                              type: 'paragraph',
                              id: 'f2-desc',
                              content: 'Современные шаблоны и гибкая настройка стилей под ваш бренд.',
                              styles: { fontSize: '14px', lineHeight: '1.6', margin: '0', color: '#aaaaaa' }
                            }
                          ]
                        },
                        {
                          type: 'column',
                          id: 'feature-3',
                          styles: {
                            flex: '1',
                            padding: '24px',
                            background: '#1a1a1a',
                            borderRadius: '12px',
                            textAlign: 'center'
                          },
                          children: [
                            {
                              type: 'heading',
                              id: 'f3-title',
                              content: '📱 Адаптивно',
                              styles: { fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }
                            },
                            {
                              type: 'paragraph',
                              id: 'f3-desc',
                              content: 'Сайты отлично выглядят на всех устройствах от телефона до десктопа.',
                              styles: { fontSize: '14px', lineHeight: '1.6', margin: '0', color: '#aaaaaa' }
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'page_services',
          slug: 'services',
          name: 'Услуги',
          seo: {
            title: 'Услуги - Мой сайт',
            description: 'Наши услуги и цены'
          },
          background: { bgId: null },
          blocks: [
            {
              type: 'section',
              id: 'section-services-hero',
              styles: {
                padding: '80px 20px',
                background: '#111111',
                textAlign: 'center'
              },
              children: [
                {
                  type: 'container',
                  id: 'services-hero-container',
                  styles: { maxWidth: '800px', margin: '0 auto' },
                  children: [
                    {
                      type: 'heading',
                      id: 'services-title',
                      content: 'Наши услуги',
                      styles: { fontSize: '42px', fontWeight: '700', margin: '0 0 16px 0', color: '#f5f5f5' }
                    },
                    {
                      type: 'paragraph',
                      id: 'services-desc',
                      content: 'Предлагаем полный спектр услуг по созданию и продвижению веб-сайтов.',
                      styles: { fontSize: '18px', lineHeight: '1.6', color: '#aaaaaa', margin: '0' }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'page_contacts',
          slug: 'contacts',
          name: 'Контакты',
          seo: {
            title: 'Контакты - Мой сайт',
            description: 'Свяжитесь с нами'
          },
          background: { bgId: null },
          blocks: [
            {
              type: 'section',
              id: 'section-contacts',
              styles: {
                padding: '80px 20px',
                background: '#0d0d0d',
                textAlign: 'center'
              },
              children: [
                {
                  type: 'container',
                  id: 'contacts-container',
                  styles: { maxWidth: '600px', margin: '0 auto' },
                  children: [
                    {
                      type: 'heading',
                      id: 'contacts-title',
                      content: 'Свяжитесь с нами',
                      styles: { fontSize: '42px', fontWeight: '700', margin: '0 0 16px 0', color: '#f5f5f5' }
                    },
                    {
                      type: 'paragraph',
                      id: 'contacts-desc',
                      content: 'Заполните форму и мы свяжемся с вами в ближайшее время.',
                      styles: { fontSize: '18px', lineHeight: '1.6', color: '#aaaaaa', margin: '0 0 32px 0' }
                    },
                    {
                      type: 'form',
                      id: 'contact-form',
                      styles: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        maxWidth: '400px',
                        margin: '0 auto'
                      },
                      children: [
                        {
                          type: 'input',
                          id: 'cf-name',
                          label: 'Имя',
                          placeholder: 'Ваше имя',
                          fieldType: 'text'
                        },
                        {
                          type: 'input',
                          id: 'cf-email',
                          label: 'Email',
                          placeholder: 'your@email.com',
                          fieldType: 'email'
                        },
                        {
                          type: 'textarea',
                          id: 'cf-message',
                          label: 'Сообщение',
                          placeholder: 'Ваше сообщение...'
                        },
                        {
                          type: 'button',
                          id: 'cf-submit',
                          content: 'Отправить',
                          styles: {
                            padding: '12px 32px',
                            background: '#ffffff',
                            color: '#0d0d0d',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '8px'
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      currentPageId: 'page_home',
      selectedBlockId: null,
      viewMode: 'desktop' // desktop | tablet | mobile
    };
  },

  /**
   * Получить полное состояние
   */
  getState() {
    return this._state;
  },

  /**
   * Получить текущую страницу
   */
  getCurrentPage() {
    return this._state.pages.find(p => p.id === this._state.currentPageId);
  },

  /**
   * Получить блок по ID
   */
  getBlockById(blockId, blocks) {
    if (!blocks) {
      // Ищем по всем страницам и глобальным секциям
      for (const page of this._state.pages) {
        const found = this._findBlockInArray(blockId, page.blocks);
        if (found) return found;
      }
      // Ищем в глобальных секциях
      for (const key of ['header', 'footer']) {
        const section = this._state.globalSections[key];
        if (section) {
          const found = this._findBlockInArray(blockId, [section]);
          if (found) return found;
        }
      }
      return null;
    }
    return this._findBlockInArray(blockId, blocks);
  },

  _findBlockInArray(blockId, arr) {
    for (const block of arr) {
      if (block.id === blockId) return block;
      if (block.children) {
        const found = this._findBlockInArray(blockId, block.children);
        if (found) return found;
      }
    }
    return null;
  },

  /**
   * Получить все блоки для текущей страницы или глобальной секции
   */
  getBlocksForCurrentPage() {
    const page = this.getCurrentPage();
    return page ? page.blocks : [];
  },

  /**
   * Обновить состояние
   */
  setState(newState) {
    this._state = { ...this._state, ...newState };
    this._saveToHistory();
    this._notify();
  },

  /**
   * Обновить блок
   */
  updateBlock(blockId, updates) {
    const updateRecursive = (blocks) => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) {
          blocks[i] = { ...blocks[i], ...updates };
          return true;
        }
        if (blocks[i].children) {
          if (updateRecursive(blocks[i].children)) return true;
        }
      }
      return false;
    };

    // Обновляем в текущей странице
    const page = this.getCurrentPage();
    if (page) {
      updateRecursive(page.blocks);
    }

    // Обновляем в глобальных секциях
    for (const key of ['header', 'footer']) {
      const section = this._state.globalSections[key];
      if (section && section.children) {
        updateRecursive(section.children);
      }
    }

    this._saveToHistory();
    this._notify();
  },

  /**
   * Добавить блок
   */
  addBlock(blockData, parentId = null, index = null) {
    const newBlock = {
      ...blockData,
      id: blockData.id || 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };

    if (parentId) {
      // Добавляем как дочерний
      const parent = this.getBlockById(parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        if (index !== null) {
          parent.children.splice(index, 0, newBlock);
        } else {
          parent.children.push(newBlock);
        }
      }
    } else {
      // Добавляем на текущую страницу
      const page = this.getCurrentPage();
      if (page) {
        if (index !== null) {
          page.blocks.splice(index, 0, newBlock);
        } else {
          page.blocks.push(newBlock);
        }
      }
    }

    this._saveToHistory();
    this._notify();
    return newBlock;
  },

  /**
   * Удалить блок
   */
  removeBlock(blockId) {
    const removeRecursive = (blocks) => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) {
          blocks.splice(i, 1);
          return true;
        }
        if (blocks[i].children) {
          if (removeRecursive(blocks[i].children)) return true;
        }
      }
      return false;
    };

    const page = this.getCurrentPage();
    if (page) {
      removeRecursive(page.blocks);
    }

    if (this._state.selectedBlockId === blockId) {
      this._state.selectedBlockId = null;
    }

    this._saveToHistory();
    this._notify();
  },

  /**
   * Переместить блок
   */
  moveBlock(blockId, newParentId, newIndex) {
    // Находим и удаляем блок из текущего расположения
    let movedBlock = null;
    const removeRecursive = (blocks) => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) {
          movedBlock = blocks.splice(i, 1)[0];
          return true;
        }
        if (blocks[i].children) {
          if (removeRecursive(blocks[i].children)) return true;
        }
      }
      return false;
    };

    const page = this.getCurrentPage();
    if (page) {
      removeRecursive(page.blocks);
    }

    if (movedBlock) {
      if (newParentId) {
        const parent = this.getBlockById(newParentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.splice(newIndex, 0, movedBlock);
        }
      } else {
        if (page) {
          page.blocks.splice(newIndex, 0, movedBlock);
        }
      }
    }

    this._saveToHistory();
    this._notify();
  },

  /**
   * Переименовать страницу
   */
  renamePage(pageId, newName) {
    const page = this._state.pages.find(p => p.id === pageId);
    if (page) {
      page.name = newName;
      // Обновляем SEO title
      page.seo.title = `${newName} - ${this._state.projectName}`;
      this._saveToHistory();
      this._notify();
    }
  },

  /**
   * Сменить slug страницы
   */
  changePageSlug(pageId, newSlug) {
    const page = this._state.pages.find(p => p.id === pageId);
    if (page) {
      page.slug = newSlug;
      this._saveToHistory();
      this._notify();
    }
  },

  /**
   * Добавить страницу
   */
  addPage(name) {
    const slug = name.toLowerCase().replace(/[^a-zа-яё0-9]/g, '-').replace(/-+/g, '-').substring(0, 30);
    const newPage = {
      id: 'page_' + Date.now(),
      slug: slug,
      name: name,
      seo: {
        title: `${name} - ${this._state.projectName}`,
        description: `Страница ${name}`
      },
      background: { bgId: null },
      blocks: []
    };
    this._state.pages.push(newPage);
    this._state.currentPageId = newPage.id;
    this._saveToHistory();
    this._notify();
    return newPage;
  },

  /**
   * Удалить страницу
   */
  removePage(pageId) {
    if (this._state.pages.length <= 1) return; // Нельзя удалить последнюю страницу
    const index = this._state.pages.findIndex(p => p.id === pageId);
    if (index !== -1) {
      this._state.pages.splice(index, 1);
      if (this._state.currentPageId === pageId) {
        this._state.currentPageId = this._state.pages[0].id;
      }
      this._saveToHistory();
      this._notify();
    }
  },

  /**
   * Переключить страницу
   */
  setCurrentPage(pageId) {
    this._state.currentPageId = pageId;
    this._state.selectedBlockId = null;
    this._notify();
  },

  /**
   * Применить сохранённый фон к странице
   */
  setPageBackground(pageId, bgId) {
    const page = this._state.pages.find(p => p.id === pageId);
    if (!page) return;
    page.background = { bgId: bgId || null };
    this._saveToHistory();
    this._notify();
  },

  /**
   * Применить сохранённый фон к секции (встраивается в HTML)
   */
  setBlockBgEmbed(blockId, bgId) {
    const block = this.getBlockById(blockId);
    if (!block || block.type !== 'section') return;
    if (bgId) {
      block.bgEmbed = { bgId: bgId };
    } else {
      delete block.bgEmbed;
    }
    this._saveToHistory();
    this._notify();
  },

  /**
   * Выбрать блок
   */
  selectBlock(blockId) {
    this._state.selectedBlockId = blockId;
    this._notify();
  },

  /**
   * Сменить режим просмотра
   */
  setViewMode(mode) {
    this._state.viewMode = mode;
    this._notify();
  },

  /**
   * Подписаться на изменения
   */
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  },

  /**
   * Уведомить слушателей
   */
  _notify() {
    this._listeners.forEach(fn => fn(this._state));
    this._scheduleAutosave();
  },

  /**
   * Сохранить в историю (undo/redo)
   */
  _saveToHistory() {
    // Обрезаем историю до текущей позиции
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(JSON.parse(JSON.stringify(this._state)));
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
    this._historyIndex = this._history.length - 1;
  },

  /**
   * Отменить
   */
  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      this._state = JSON.parse(JSON.stringify(this._history[this._historyIndex]));
      this._notify();
    }
  },

  /**
   * Повторить
   */
  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      this._state = JSON.parse(JSON.stringify(this._history[this._historyIndex]));
      this._notify();
    }
  },

  /**
   * Можно ли отменить
   */
  canUndo() {
    return this._historyIndex > 0;
  },

  /**
   * Можно ли повторить
   */
  canRedo() {
    return this._historyIndex < this._history.length - 1;
  },

  /**
   * Получить JSON проекта для экспорта
   */
  getProjectJSON() {
    return JSON.stringify(this._state, null, 2);
  }
};

// Инициализируем
Store.init();

