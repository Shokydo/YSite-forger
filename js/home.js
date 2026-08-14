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
    this.renderSavedBgsGrid();
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
    this.renderSavedBgsGrid();
    // Возврат из BG·LAB: сбрасываем состояние его экранов
    const bghome = document.getElementById('bghome');
    const bgedit = document.getElementById('bgedit');
    if (bghome) bghome.classList.remove('hidden');
    if (bgedit) bgedit.classList.add('hidden');
  },

  /* ---------- Сохранённые фоны на главной ---------- */
  renderSavedBgsGrid() {
    const grid = document.getElementById('savedBgsGrid');
    if (!grid) return;

    const all = BackgroundsLib.getAll();
    if (!all.length) {
      grid.innerHTML = '<div class="bgpicker-empty">Пока нет сохранённых фонов.<br>Откройте BG·LAB, создайте фон и нажмите «Сохранить фон».</div>';
      return;
    }

    grid.innerHTML = all.map(b => `
      <div class="home-bg-card" data-bg-id="${b.id}">
        <div class="prev"></div>
        <div class="bar"><b>${this._esc(b.name)}</b><span>${new Date(b.createdAt).toLocaleDateString('ru-RU')}</span></div>
        <div class="actions">
          <button data-a="apply" title="Применить к странице">Применить</button>
          <button data-a="edit" title="Редактировать в BG·LAB">Редактировать</button>
          <button data-a="del" title="Удалить">✕</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.home-bg-card').forEach(card => {
      const id = card.dataset.bgId;
      const b = BackgroundsLib.get(id);
      const prev = card.querySelector('.prev');
      if (b && prev) {
        try { show(prev, b.state, 'h' + id.replace(/[^a-zA-Z0-9]/g, '')); } catch (e) { console.error(e); }
      }
      card.querySelector('.prev').addEventListener('click', () => this.applyBg(id));
      card.querySelector('[data-a="apply"]').addEventListener('click', (e) => { e.stopPropagation(); this.applyBg(id); });
      card.querySelector('[data-a="edit"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.openSavedInEditor) {
          if (window.AppController) window.AppController.openBgLab();
          window.openSavedInEditor(b);
        }
      });
      card.querySelector('[data-a="del"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const bg = BackgroundsLib.get(id);
        if (bg && confirm('Удалить фон «' + bg.name + '»?')) {
          BackgroundsLib.remove(id);
          this.renderSavedBgsGrid();
        }
      });
    });
  },

  applyBg(bgId) {
    const page = Store.getCurrentPage();
    if (!page) return;
    Store.setPageBackground(page.id, bgId);
    this.openEditor(window.__editorMode);
    toast('Фон применён к странице «' + page.name + '»');
  },

  /* ---------- Сброс проекта ---------- */
  resetProject() {
    if (confirm('Сбросить проект к начальному состоянию? Это действие нельзя отменить.')) {
      Store.reset();
      this.openEditor(window.__editorMode);
      toast('Проект сброшен');
    }
  },

  /* ---------- События ---------- */
  _bindHomeEvents() {
    const bind = (ids, fn) => ids.forEach(id => document.getElementById(id)?.addEventListener('click', fn));

    bind(['createBgBtn', 'card-bg'], () => this.openBgLab());
    bind(['createHtmlBtn', 'card-html'], () => this.openEditor('html'));
    bind(['createZipBtn', 'card-zip'], () => this.openEditor('zip'));

    document.getElementById('backToHomeBtn')?.addEventListener('click', () => this.goHome());
    document.getElementById('refreshBgsBtn')?.addEventListener('click', () => this.renderSavedBgsGrid());

    document.getElementById('openSavedProjectsBtn')?.addEventListener('click', () => {
      toast('Проект сохраняется автоматически в этом браузере');
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
