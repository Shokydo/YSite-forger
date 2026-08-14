/* =========================================================
   SiteForge Home/App Controller
   Управление вьюхами (home / editor / bglab), режимами
   проекта и применение сохранённых фонов.
   ========================================================= */

const AppController = {
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Режим проекта по умолчанию
    window.__editorMode = window.__editorMode || 'html';

    this._bindHomeEvents();
    this._bindEditorEvents();
    this.setEditorMode(window.__editorMode);
    this._activeProjectId = null;
    this.renderProjectsGrid();
  },

  /* ---------- Вьюхи ---------- */
  showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  },

  setEditorMode(mode) {
    window.__editorMode = mode === 'zip' ? 'zip' : 'html';
    const badge = document.getElementById('modeBadge');
    if (badge) badge.textContent = window.__editorMode === 'zip' ? 'Полный проект (ZIP)' : 'Одностраничный HTML';
    const h = document.getElementById('setHtmlMode');
    const z = document.getElementById('setZipMode');
    if (h) h.classList.toggle('active', window.__editorMode === 'html');
    if (z) z.classList.toggle('active', window.__editorMode === 'zip');
  },

  openEditor(mode) {
    if (mode) this.setEditorMode(mode);
    this.showView('view-editor');
  },

  openBgLab() {
    this.showView('view-bglab');
    if (window.renderBGSaved) window.renderBGSaved();
  },

  goHome() {
    this.showView('view-home');
    this.renderProjectsGrid();
    // Возврат из BG·LAB: сбрасываем состояние его экранов
    const bghome = document.getElementById('bghome');
    const bgedit = document.getElementById('bgedit');
    if (bghome) bghome.classList.remove('hidden');
    if (bgedit) bgedit.classList.add('hidden');
  },

  /* ---------- Мои проекты ---------- */
  renderProjectsGrid() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    const all = ProjectsLib.getAll();
    if (!all.length) {
      grid.innerHTML = '<div class="bgpicker-empty">Пока нет сохранённых проектов.<br>Создайте сайт в редакторе и нажмите «Сохранить проект».</div>';
      this._updateSaveProjectLabel();
      return;
    }

    grid.innerHTML = all.map(p => `
      <div class="home-bg-card" data-proj-id="${p.id}">
        <div class="prev project-preview"></div>
        <div class="bar"><b>${this._esc(p.name)}</b><span>${new Date(p.savedAt).toLocaleDateString('ru-RU')}</span></div>
        <div class="actions">
          <button data-a="open" title="Открыть в редакторе">Открыть</button>
          <button data-a="ren" title="Переименовать">✎</button>
          <button data-a="del" title="Удалить">✕</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.home-bg-card').forEach(card => {
      const id = card.dataset.projId;
      const proj = ProjectsLib.get(id);
      const prev = card.querySelector('.prev');
      if (proj && prev) this._renderProjectPreview(prev, proj);
      card.querySelector('.prev').addEventListener('click', () => this.openProject(id));
      card.querySelector('[data-a="open"]').addEventListener('click', (e) => { e.stopPropagation(); this.openProject(id); });
      card.querySelector('[data-a="ren"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const p = ProjectsLib.get(id);
        if (!p) return;
        const n = prompt('Новое имя проекта:', p.name);
        if (n && n.trim()) {
          ProjectsLib.rename(id, n.trim());
          this.renderProjectsGrid();
          toast('Проект переименован');
        }
      });
      card.querySelector('[data-a="del"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const p = ProjectsLib.get(id);
        if (p && confirm('Удалить проект «' + p.name + '»?')) {
          ProjectsLib.remove(id);
          if (this._activeProjectId === id) { this._activeProjectId = null; this._updateSaveProjectLabel(); }
          this.renderProjectsGrid();
          toast('Проект удалён');
        }
      });
    });

    this._updateSaveProjectLabel();
  },

  _renderProjectPreview(prev, proj) {
    const st = proj.state;
    if (!st || !Array.isArray(st.pages) || !st.pages.length) {
      prev.innerHTML = '<div class="project-preview-empty">Пустой проект</div>';
      return;
    }
    try {
      const page = st.pages[0];
      const inner = document.createElement('div');
      inner.className = 'project-preview-inner';
      inner.style.width = '1440px';

      let bgHtml = '';
      if (page.background && page.background.bgId) {
        const bg = BackgroundsLib.get(page.background.bgId);
        if (bg) bgHtml = '<div class="canvas-bg">' + BackgroundsLib.svgFor(bg.state, 'pp' + proj.id.replace(/[^a-zA-Z0-9]/g, '')) + '</div>';
      }
      inner.innerHTML = bgHtml + '<div class="canvas-content">' + (Renderer._renderBlocks ? Renderer._renderBlocks(page.blocks) : '') + '</div>';
      prev.appendChild(inner);

      const w = prev.clientWidth || 260;
      inner.style.transform = 'scale(' + (w / 1440) + ')';
    } catch (e) {
      prev.innerHTML = '<div class="project-preview-empty">—</div>';
    }
  },

  _updateSaveProjectLabel() {
    const lb = document.getElementById('saveProjectLabel');
    if (!lb) return;
    lb.textContent = this._activeProjectId ? 'Сохранить изменения' : 'Сохранить проект';
    const btn = document.getElementById('saveProjectBtn');
    if (btn) btn.title = this._activeProjectId ? 'Обновить открытый проект' : 'Сохранить текущий проект как новый';
  },

  saveProject() {
    const state = Store.getState();
    if (!state) { toast('Сначала создайте сайт'); return; }
    if (this._activeProjectId) {
      const existing = ProjectsLib.get(this._activeProjectId);
      if (!existing) {
        this._activeProjectId = null;
        this._updateSaveProjectLabel();
      } else {
        ProjectsLib.update(this._activeProjectId, state);
        this.renderProjectsGrid();
        toast('Изменения проекта сохранены ✓');
        return;
      }
    }
    const all = ProjectsLib.getAll();
    const name = prompt('Имя проекта:', state.projectName || 'Проект ' + (all.length + 1));
    if (name && name.trim()) {
      const item = ProjectsLib.save(state, name.trim());
      this._activeProjectId = item.id;
      this.renderProjectsGrid();
      toast('Проект сохранён ✓');
    }
  },

  openProject(id) {
    const proj = ProjectsLib.get(id);
    if (!proj) return;
    Store.loadProject(proj.state);
    this._activeProjectId = id;
    this._updateSaveProjectLabel();
    this.openEditor(window.__editorMode);
    toast('Проект «' + proj.name + '» открыт');
  },

  /* ---------- Сброс проекта ---------- */
  resetProject() {
    if (confirm('Сбросить проект к начальному состоянию? Это действие нельзя отменить.')) {
      Store.reset();
      this._activeProjectId = null;
      this._updateSaveProjectLabel();
      this.openEditor(window.__editorMode);
      toast('Проект сброшен');
    }
  },

  /* ---------- События ---------- */
  _bindHomeEvents() {
    const bind = (ids, fn) => ids.forEach(id => document.getElementById(id)?.addEventListener('click', fn));
    const fresh = () => { this._activeProjectId = null; this._updateSaveProjectLabel(); };

    bind(['createBgBtn', 'card-bg'], () => this.openBgLab());
    bind(['createHtmlBtn', 'card-html'], () => { fresh(); this.openEditor('html'); });
    bind(['createZipBtn', 'card-zip'], () => { fresh(); this.openEditor('zip'); });

    document.getElementById('backToHomeBtn')?.addEventListener('click', () => this.goHome());
    document.getElementById('saveProjectBtn')?.addEventListener('click', () => this.saveProject());
    document.getElementById('refreshProjectsBtn')?.addEventListener('click', () => this.renderProjectsGrid());

    document.getElementById('openSavedProjectsBtn')?.addEventListener('click', () => {
      const sec = document.getElementById('projectsSection');
      this.renderProjectsGrid();
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  },

  _bindEditorEvents() {
    document.getElementById('resetProjectBtn')?.addEventListener('click', () => this.resetProject());
    document.getElementById('setHtmlMode')?.addEventListener('click', () => this.setEditorMode('html'));
    document.getElementById('setZipMode')?.addEventListener('click', () => this.setEditorMode('zip'));
  },

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};

/* Экспорт контроллера: кнопка «← Назад» в BG·LAB вызывает AppController.goHome() */
window.AppController = AppController;

/* Инициализация при загрузке DOM */
document.addEventListener('DOMContentLoaded', () => {
  AppController.init();
});
