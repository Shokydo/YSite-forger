/* ===== SiteForge Renderer - Преобразует JSON в DOM ===== */

const Renderer = {
  /**
   * Рендерит все блоки текущей страницы + глобальные header/footer
   */
  renderFullPage(state) {
    const page = state.pages.find(p => p.id === state.currentPageId);
    if (!page) return '<div class="placeholder-block">Выберите страницу для редактирования</div>';

    const header = state.globalSections?.header;
    const footer = state.globalSections?.footer;

    let html = '';

    // Header
    if (header) {
      html += `<header class="global-header" data-block-id="${header.id}">`;
      html += this._renderChildren(header.children || []);
      html += `</header>`;
    }

    // Main content with virtual page
    html += `<main>`;
    html += `<div data-virtual-page="${page.slug}" class="v-page active">`;
    html += this._renderBlocks(page.blocks);
    html += `</div>`;
    html += `</main>`;

    // Footer
    if (footer) {
      html += `<footer class="global-footer" data-block-id="${footer.id}">`;
      html += this._renderChildren(footer.children || []);
      html += `</footer>`;
    }

    return html;
  },

  /**
   * Рендерит блоки на канвасе (с обёртками для редактирования)
   */
  renderCanvas(state) {
    const page = state.pages.find(p => p.id === state.currentPageId);
    if (!page) return '<div class="placeholder-block">Выберите страницу для редактирования</div>';

    return this._renderBlocksWithWrappers(page.blocks, state.selectedBlockId);
  },

  /**
   * Рендерит блоки с обёртками для интерактивности на канвасе
   */
  _renderBlocksWithWrappers(blocks, selectedId) {
    if (!blocks || blocks.length === 0) {
      return '<div class="canvas-drop-zone" id="dropZone"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg><span>Перетащите блоки сюда</span></div>';
    }

    return blocks.map((block, index) => {
      const isSelected = block.id === selectedId;
      const content = this._renderBlockContent(block, true);
      
      return `
        <div class="block-wrapper ${isSelected ? 'selected' : ''}" 
             data-block-id="${block.id}" 
             data-block-type="${block.type}"
             data-index="${index}"
             draggable="true">
          <div class="block-actions">
            <button class="btn-move-up" onclick="event.stopPropagation(); StoreController.moveBlock('${block.id}', -1)" title="Переместить вверх">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button class="btn-move-down" onclick="event.stopPropagation(); StoreController.moveBlock('${block.id}', 1)" title="Переместить вниз">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button class="btn-delete" onclick="event.stopPropagation(); StoreController.removeBlock('${block.id}')" title="Удалить">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          ${content}
        </div>
      `;
    }).join('\n');
  },

  /**
   * Рендерит блоки (без обёрток, для экспорта)
   */
  _renderBlocks(blocks) {
    if (!blocks || blocks.length === 0) return '';
    return blocks.map(block => this._renderBlockContent(block, false)).join('\n');
  },

  _renderChildren(children) {
    if (!children || children.length === 0) return '';
    return children.map(child => this._renderBlockContent(child, false)).join('\n');
  },

  /**
   * Рендерит содержимое блока
   */
  _renderBlockContent(block, isEditor = false) {
    if (!block) return '';

    const styleAttr = this._styleObjectToAttr(block.styles);
    const dataAttrs = `data-block-id="${block.id}" data-type="${block.type}"`;

    switch (block.type) {
      case 'section': {
        const bgEmbed = this._bgEmbed(block);
        return `<section class="rendered-section${bgEmbed ? ' has-bg' : ''}" ${dataAttrs} style="${styleAttr}">
          ${bgEmbed}
          <div class="rendered-section-inner">${block.children ? this._renderChildrenInEditor(block.children, isEditor) : ''}</div>
        </section>`;
      }

      case 'container':
        return `<div class="rendered-container" ${dataAttrs} style="${styleAttr}">
          ${block.children ? this._renderChildrenInEditor(block.children, isEditor) : ''}
        </div>`;

      case 'columns':
        return `<div class="rendered-columns" ${dataAttrs} style="${styleAttr}">
          ${block.children ? this._renderChildrenInEditor(block.children, isEditor) : ''}
        </div>`;

      case 'column':
        return `<div class="rendered-column" ${dataAttrs} style="${styleAttr}">
          ${block.children ? this._renderChildrenInEditor(block.children, isEditor) : ''}
        </div>`;

      case 'heading':
        const level = block.level || 'h2';
        return `<${level} class="rendered-heading" ${dataAttrs} style="${styleAttr}">${this._escapeHtml(block.content || '')}</${level}>`;

      case 'paragraph':
        return `<p class="rendered-paragraph" ${dataAttrs} style="${styleAttr}">${this._escapeHtml(block.content || '')}</p>`;

      case 'button':
        const href = block.href || '#';
        return `<a href="${href}" class="rendered-button" ${dataAttrs} style="${styleAttr}">${this._escapeHtml(block.content || 'Кнопка')}</a>`;

      case 'image':
        const src = block.src || 'https://placehold.co/800x400';
        const alt = block.alt || 'Image';
        return `<img src="${src}" alt="${alt}" class="rendered-image" ${dataAttrs} style="${styleAttr}" loading="lazy" />`;

      case 'divider':
        return `<hr class="rendered-divider" ${dataAttrs} style="${styleAttr}" />`;

      case 'list':
        const tag = block.listType === 'ordered' ? 'ol' : 'ul';
        const items = block.items || ['Элемент'];
        return `<${tag} class="rendered-list" ${dataAttrs} style="${styleAttr}">
          ${items.map(item => `<li>${this._escapeHtml(item)}</li>`).join('\n')}
        </${tag}>`;

      case 'gallery':
        const cols = block.columns || 3;
        const images = block.images || [];
        return `<div class="rendered-gallery rendered-gallery-${cols}" ${dataAttrs}>
          ${images.map(img => `<img src="${img}" alt="" loading="lazy" />`).join('\n')}
        </div>`;

      case 'form':
        return `<form class="rendered-form" ${dataAttrs} style="${styleAttr}" data-form-action="${block.formAction || 'message'}">
          ${block.children ? this._renderChildrenInEditor(block.children, isEditor) : ''}
        </form>`;

      case 'input':
        return `<label style="font-size:13px;color:#64748b;margin-bottom:4px;display:block">${this._escapeHtml(block.label || '')}</label>
          <input type="${block.fieldType || 'text'}" placeholder="${this._escapeHtml(block.placeholder || '')}" ${block.required ? 'required' : ''} ${dataAttrs} />`;

      case 'textarea':
        return `<label style="font-size:13px;color:#64748b;margin-bottom:4px;display:block">${this._escapeHtml(block.label || '')}</label>
          <textarea placeholder="${this._escapeHtml(block.placeholder || '')}" ${block.required ? 'required' : ''} ${dataAttrs}></textarea>`;

      case 'nav':
        return `<nav ${dataAttrs} style="${styleAttr}">
          ${block.children ? this._renderChildrenInEditor(block.children, isEditor) : ''}
        </nav>`;

      case 'nav-link':
        return `<a href="${block.href || '#'}" class="nav-link" ${dataAttrs} style="${styleAttr}">${this._escapeHtml(block.content || 'Ссылка')}</a>`;

      case 'global-header':
        return `<header class="global-header" ${dataAttrs} style="${styleAttr}">
          ${block.children ? this._renderChildrenInEditor(block.children, isEditor) : ''}
        </header>`;

      case 'global-footer':
        return `<footer class="global-footer" ${dataAttrs} style="${styleAttr}">
          ${block.children ? this._renderChildrenInEditor(block.children, isEditor) : ''}
        </footer>`;

      default:
        return `<div ${dataAttrs} style="${styleAttr}">${block.content || ''}</div>`;
    }
  },

  /**
   * Рендерит дочерние элементы с обёртками (если это редактор)
   */
  _renderChildrenInEditor(children, isEditor) {
    if (isEditor) {
      return this._renderBlocksWithWrappers(children, Store.getState().selectedBlockId);
    }
    return this._renderBlocks(children);
  },

  /**
   * Встроенный фон секции (сохранённый фон BG·LAB)
   */
  _bgEmbed(block) {
    if (!block || !block.bgEmbed || !block.bgEmbed.bgId) return '';
    const bg = BackgroundsLib.get(block.bgEmbed.bgId);
    if (!bg) return '';
    const uid = 'b' + String(block.id).replace(/[^a-zA-Z0-9_]/g, '');
    return BackgroundsLib.layerHtml(bg.state, uid);
  },

  /**
   * SVG фона страницы для экспорта
   */
  _pageBgSvg(bgId, slug) {
    if (!bgId) return '';
    const bg = BackgroundsLib.get(bgId);
    if (!bg) return '';
    const uid = 'p' + String(slug).replace(/[^a-zA-Z0-9_]/g, '');
    return BackgroundsLib.svgFor(bg.state, uid);
  },

  /**
   * Нужен ли курсор-FX скрипт (фон страницы или секций содержат курсор)
   */
  _needsCursorScript(state) {
    for (const p of state.pages || []) {
      if (p.background && p.background.bgId) {
        const bg = BackgroundsLib.get(p.background.bgId);
        if (bg && BackgroundsLib.hasCursorLayer(bg.state)) return true;
      }
      if (this._blocksNeedCursor(p.blocks)) return true;
    }
    return false;
  },

  _blocksNeedCursor(blocks) {
    for (const b of blocks || []) {
      if (b.bgEmbed && b.bgEmbed.bgId) {
        const bg = BackgroundsLib.get(b.bgEmbed.bgId);
        if (bg && BackgroundsLib.hasCursorLayer(bg.state)) return true;
      }
      if (b.children && this._blocksNeedCursor(b.children)) return true;
    }
    return false;
  },

  /**
   * Преобразует объект стилей в строку для атрибута style
   */
  _styleObjectToAttr(styles) {
    if (!styles || typeof styles !== 'object') return '';
    return Object.entries(styles)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  },

  /**
   * Экранирует HTML
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Генерирует полный HTML документ для экспорта
   */
  generateFullHTML(state, options = {}) {
    const {
      minify = false,
      inlineBase64 = true,
      webp = true
    } = options;

    const page = state.pages.find(p => p.state?.currentPageId || state.currentPageId) || state.pages[0];
    const globalColors = state.globalSettings?.colors || {};
    const globalFonts = state.globalSettings?.fonts || {};
    const globalHeader = state.globalSections?.header;
    const globalFooter = state.globalSections?.footer;

    // CSS стили
    let css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: ${globalFonts.primary || 'Inter, sans-serif'}; color: ${globalColors.text || '#f5f5f5'}; background: ${globalColors.background || '#0d0d0d'}; }
.global-header { width: 100%; }
.global-footer { width: 100%; }
.v-page { display: none; position: relative; }
.v-page.active { display: block; }
.v-page .bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
.v-page .bg svg { width: 100%; height: 100%; display: block; }
.v-page .v-content { position: relative; z-index: 1; }
.rendered-section { padding: 40px 20px; }
.rendered-section.has-bg { position: relative; overflow: hidden; }
.rendered-section.has-bg .bg-embed { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
.rendered-section.has-bg .bg-embed svg { width: 100%; height: 100%; display: block; }
.rendered-section.has-bg .rendered-section-inner { position: relative; z-index: 1; }
.rendered-container { max-width: 1100px; margin: 0 auto; padding: 20px; }
.rendered-columns { display: flex; gap: 20px; }
.rendered-column { flex: 1; }
.rendered-heading { line-height: 1.3; margin: 0 0 16px 0; }
.rendered-paragraph { line-height: 1.6; margin: 0 0 12px 0; font-size: 16px; }
.rendered-button { display: inline-block; padding: 12px 28px; background: ${globalColors.primary || '#ffffff'}; color: #0d0d0d; border: none; border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s ease; }
.rendered-button:hover { opacity: 0.9; transform: translateY(-1px); }
.rendered-image { max-width: 100%; height: auto; border-radius: 8px; display: block; }
.rendered-divider { border: none; height: 1px; background: #2a2a2a; margin: 20px 0; }
.rendered-list { line-height: 1.6; margin: 0 0 12px 24px; }
.rendered-list li { margin-bottom: 4px; }
.rendered-gallery { display: grid; gap: 12px; }
.rendered-gallery-2 { grid-template-columns: 1fr 1fr; }
.rendered-gallery-3 { grid-template-columns: 1fr 1fr 1fr; }
.rendered-gallery-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
.rendered-gallery img { width: 100%; height: 200px; object-fit: cover; border-radius: 6px; }
.rendered-form { display: flex; flex-direction: column; gap: 12px; }
.rendered-form input, .rendered-form textarea { padding: 10px 14px; border: 1px solid #2a2a2a; border-radius: 6px; font-size: 14px; font-family: inherit; outline: none; background: #1a1a1a; color: #f5f5f5; }
.rendered-form input:focus, .rendered-form textarea:focus { border-color: ${globalColors.primary || '#ffffff'}; }
.nav-link { color: #cccccc; text-decoration: none; font-size: 14px; font-weight: 500; }
.nav-link.active { color: ${globalColors.primary || '#ffffff'}; }
    `.trim();

    // JS
    let js = `
(function() {
  var navLinks = document.querySelectorAll('.nav-link');
  var pages = document.querySelectorAll('.v-page');
  var pageData = ${JSON.stringify(state.pages.reduce((acc, p) => {
    acc[p.slug] = { title: p.seo?.title || '', description: p.seo?.description || '' };
    return acc;
  }, {}))};

  function switchPage(pageId) {
    pages.forEach(function(page) {
      page.classList.remove('active');
      if (page.dataset.virtualPage === pageId) {
        page.classList.add('active');
      }
    });
    navLinks.forEach(function(link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + pageId) {
        link.classList.add('active');
      }
    });
    history.pushState(null, '', '#' + pageId);
    updateSEO(pageId);
    window.scrollTo(0, 0);
  }

  function updateSEO(pageId) {
    var data = pageData[pageId];
    if (data) {
      if (data.title) document.title = data.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && data.description) {
        metaDesc.setAttribute('content', data.description);
      }
    }
  }

  navLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var pageId = this.getAttribute('href').substring(1);
      switchPage(pageId);
    });
  });

  window.addEventListener('popstate', function() {
    var pageId = window.location.hash.substring(1) || '${state.pages[0]?.slug || 'home'}';
    switchPage(pageId);
  });

  // Формы
  var forms = document.querySelectorAll('.rendered-form');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var action = this.dataset.formAction || 'message';
      var formData = new FormData(this);
      var data = {};
      formData.forEach(function(value, key) { data[key] = value; });
      
      if (action === 'download') {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'form-data.json';
        a.click();
        URL.revokeObjectURL(url);
        alert('Данные сохранены!');
      } else if (action === 'mailto') {
        var params = Object.entries(data).map(function(kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); }).join('&');
        window.location.href = 'mailto:?subject=' + encodeURIComponent(document.title) + '&body=' + encodeURIComponent(JSON.stringify(data, null, 2));
      } else {
        alert('Спасибо за обращение! Мы свяжемся с вами.');
      }
    });
  });

  // Инициализация
  var initialPage = window.location.hash.substring(1) || '${state.pages[0]?.slug || 'home'}';
  switchPage(initialPage);
})();
    `.trim();

    if (minify) {
      css = css.replace(/\/\*.*?\*\//g, '').replace(/\s+/g, ' ').trim();
      js = js.replace(/\/\/.*/g, '').replace(/\s+/g, ' ').trim();
    }

    // Собираем HTML всех страниц
    const allPagesHtml = state.pages.map(p => {
      const headerHtml = globalHeader ? this._renderChildren(globalHeader.children || []) : '';
      const footerHtml = globalFooter ? this._renderChildren(globalFooter.children || []) : '';
      const pageBgSvg = this._pageBgSvg(p.background?.bgId, p.slug);
      
      let pageHtml = '';
      if (headerHtml) pageHtml += `<header class="global-header">${headerHtml}</header>`;
      pageHtml += `<main><div data-virtual-page="${p.slug}" class="v-page">${pageBgSvg ? `<div class="bg">${pageBgSvg}</div>` : ''}<div class="v-content">${this._renderBlocks(p.blocks)}</div></div></main>`;
      if (footerHtml) pageHtml += `<footer class="global-footer">${footerHtml}</footer>`;
      
      return pageHtml;
    }).join('\n');

    // Скрипт курсор-FX, если какой-то из фонов его использует
    const cursorScript = this._needsCursorScript(state) ? BackgroundsLib.cursorScript() : '';

    const fullHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${state.projectName || 'Мой сайт'}</title>
  <meta name="description" content="${state.pages[0]?.seo?.description || ''}">
  <style>${css}</style>
</head>
<body>
${allPagesHtml}
${cursorScript}
<script>${js}<\/script>
</body>
</html>`;

    return minify ? fullHtml.replace(/\s+/g, ' ').trim() : fullHtml;
  },

  /**
   * Генерирует CSS для экспорта в ZIP
   */
  generateCSS(state) {
    const globalColors = state.globalSettings?.colors || {};
    const globalFonts = state.globalSettings?.fonts || {};
    
    return `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: ${globalFonts.primary || 'Inter, sans-serif'}; color: ${globalColors.text || '#f5f5f5'}; background: ${globalColors.background || '#0d0d0d'}; }
.global-header { width: 100%; }
.global-footer { width: 100%; }
.v-page { display: none; position: relative; }
.v-page.active { display: block; }
.v-page .bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
.v-page .bg svg { width: 100%; height: 100%; display: block; }
.v-page .v-content { position: relative; z-index: 1; }
.rendered-section { padding: 40px 20px; }
.rendered-section.has-bg { position: relative; overflow: hidden; }
.rendered-section.has-bg .bg-embed { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
.rendered-section.has-bg .bg-embed svg { width: 100%; height: 100%; display: block; }
.rendered-section.has-bg .rendered-section-inner { position: relative; z-index: 1; }
.rendered-container { max-width: 1100px; margin: 0 auto; padding: 20px; }
.rendered-columns { display: flex; gap: 20px; }
.rendered-column { flex: 1; }
.rendered-heading { line-height: 1.3; margin: 0 0 16px 0; }
.rendered-paragraph { line-height: 1.6; margin: 0 0 12px 0; font-size: 16px; }
.rendered-button { display: inline-block; padding: 12px 28px; background: ${globalColors.primary || '#ffffff'}; color: #0d0d0d; border: none; border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s ease; }
.rendered-button:hover { opacity: 0.9; transform: translateY(-1px); }
.rendered-image { max-width: 100%; height: auto; border-radius: 8px; display: block; }
.rendered-divider { border: none; height: 1px; background: #2a2a2a; margin: 20px 0; }
.rendered-list { line-height: 1.6; margin: 0 0 12px 24px; }
.rendered-list li { margin-bottom: 4px; }
.rendered-gallery { display: grid; gap: 12px; }
.rendered-gallery-2 { grid-template-columns: 1fr 1fr; }
.rendered-gallery-3 { grid-template-columns: 1fr 1fr 1fr; }
.rendered-gallery-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
.rendered-gallery img { width: 100%; height: 200px; object-fit: cover; border-radius: 6px; }
.rendered-form { display: flex; flex-direction: column; gap: 12px; }
.rendered-form input, .rendered-form textarea { padding: 10px 14px; border: 1px solid #2a2a2a; border-radius: 6px; font-size: 14px; font-family: inherit; outline: none; background: #1a1a1a; color: #f5f5f5; }
.rendered-form input:focus, .rendered-form textarea:focus { border-color: ${globalColors.primary || '#ffffff'}; }
.nav-link { color: #cccccc; text-decoration: none; font-size: 14px; font-weight: 500; }
.nav-link.active { color: ${globalColors.primary || '#ffffff'}; }
    `.trim();
  },

  /**
   * Генерирует JS для экспорта в ZIP
   */
  generateJS(state) {
    return `
(function() {
  var navLinks = document.querySelectorAll('.nav-link');
  var pages = document.querySelectorAll('.v-page');
  var pageData = ${JSON.stringify(state.pages.reduce((acc, p) => {
    acc[p.slug] = { title: p.seo?.title || '', description: p.seo?.description || '' };
    return acc;
  }, {}))};

  function switchPage(pageId) {
    pages.forEach(function(page) {
      page.classList.remove('active');
      if (page.dataset.virtualPage === pageId) {
        page.classList.add('active');
      }
    });
    navLinks.forEach(function(link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + pageId) {
        link.classList.add('active');
      }
    });
    history.pushState(null, '', '#' + pageId);
    updateSEO(pageId);
    window.scrollTo(0, 0);
  }

  function updateSEO(pageId) {
    var data = pageData[pageId];
    if (data) {
      if (data.title) document.title = data.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && data.description) {
        metaDesc.setAttribute('content', data.description);
      }
    }
  }

  navLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var pageId = this.getAttribute('href').substring(1);
      switchPage(pageId);
    });
  });

  window.addEventListener('popstate', function() {
    var pageId = window.location.hash.substring(1) || '${state.pages[0]?.slug || 'home'}';
    switchPage(pageId);
  });

  var forms = document.querySelectorAll('.rendered-form');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var action = this.dataset.formAction || 'message';
      var formData = new FormData(this);
      var data = {};
      formData.forEach(function(value, key) { data[key] = value; });
      
      if (action === 'download') {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'form-data.json';
        a.click();
        URL.revokeObjectURL(url);
        alert('Данные сохранены!');
      } else if (action === 'mailto') {
        var params = Object.entries(data).map(function(kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); }).join('&');
        window.location.href = 'mailto:?subject=' + encodeURIComponent(document.title) + '&body=' + encodeURIComponent(JSON.stringify(data, null, 2));
      } else {
        alert('Спасибо за обращение! Мы свяжемся с вами.');
      }
    });
  });

  var initialPage = window.location.hash.substring(1) || '${state.pages[0]?.slug || 'home'}';
  switchPage(initialPage);
})();
    `.trim();
  }
};

