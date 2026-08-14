/* =========================================================
   SiteForge Projects — хранилище нескольких проектов
   Каждый проект — полный снапшот состояния Store.
   ========================================================= */

const ProjectsLib = {
  _key: 'siteforge_projects_v1',

  getAll() {
    try {
      const raw = localStorage.getItem(this._key);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  },

  get(id) {
    return this.getAll().find(p => String(p.id) === String(id)) || null;
  },

  /* Сохранить проект (новый) */
  save(state, name) {
    const all = this.getAll();
    const item = {
      id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name || 'Проект ' + (all.length + 1),
      savedAt: Date.now(),
      state: JSON.parse(JSON.stringify(state))
    };
    all.unshift(item);
    this._persist(all);
    return item;
  },

  /* Обновить снапшот существующего проекта (in-place) */
  update(id, state, name) {
    const all = this.getAll();
    const p = all.find(x => String(x.id) === String(id));
    if (p) {
      p.state = JSON.parse(JSON.stringify(state));
      p.savedAt = Date.now();
      if (name && name.trim()) p.name = name.trim();
      this._persist(all);
      return p;
    }
    return null;
  },

  remove(id) {
    this._persist(this.getAll().filter(p => String(p.id) !== String(id)));
  },

  rename(id, newName) {
    const all = this.getAll();
    const p = all.find(x => String(x.id) === String(id));
    if (p && newName && newName.trim()) {
      p.name = newName.trim();
      this._persist(all);
    }
  },

  _persist(all) {
    try {
      localStorage.setItem(this._key, JSON.stringify(all));
    } catch (e) {
      console.warn('ProjectsLib: не удалось сохранить', e);
    }
  }
};
