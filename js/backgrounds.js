/* =========================================================
   SiteForge Backgrounds — хранилище фонов BG·LAB
   Сохранённые фоны живут в localStorage и могут быть
   применены к странице или секции и встроены в экспорт.
   ========================================================= */

const BackgroundsLib = {
  _key: 'siteforge_saved_bgs_v1',

  /* ---------- CRUD ---------- */
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
    return this.getAll().find(b => String(b.id) === String(id)) || null;
  },

  save(state, name) {
    const all = this.getAll();
    const item = {
      id: 'bg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name || 'Фон ' + (all.length + 1),
      createdAt: Date.now(),
      state: JSON.parse(JSON.stringify(state))
    };
    all.unshift(item);
    this._persist(all);
    return item;
  },

  remove(id) {
    this._persist(this.getAll().filter(b => String(b.id) !== String(id)));
  },

  rename(id, newName) {
    const all = this.getAll();
    const b = all.find(x => String(x.id) === String(id));
    if (b && newName && newName.trim()) {
      b.name = newName.trim();
      this._persist(all);
    }
  },

  _persist(all) {
    try {
      localStorage.setItem(this._key, JSON.stringify(all));
    } catch (e) {
      console.warn('BackgroundsLib: не удалось сохранить в localStorage', e);
    }
  },

  /* ---------- Сборка SVG/HTML ---------- */
  svgFor(state, uid) {
    if (!state) return '';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">' + buildSVG(state, uid) + '</svg>';
  },

  /* Встраиваемый слой фона (для секции / страницы) */
  layerHtml(state, uid) {
    if (!state) return '';
    return '<div class="bg-embed">' + this.svgFor(state, uid) + '</div>';
  },

  /* Полный HTML-файл фона (как копия из BG·LAB) */
  htmlFor(state) {
    if (!state) return '';
    return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Мой фон</title><style>*{margin:0;box-sizing:border-box}html,body{height:100%}.bg{position:fixed;inset:0;z-index:-1;overflow:hidden}.bg svg{width:100%;height:100%;display:block}</style></head><body><div class="bg">' + this.svgFor(state, 'e') + '</div>' + this.cursorScript() + '</body></html>';
  },

  /* CSS-правило для фона в виде data-uri */
  cssFor(state) {
    if (!state) return '';
    const svg = this.svgFor(state, 'e');
    return '.bg{position:fixed;inset:0;background:' + (state.bgBase || '#0a0a0a') + ' url("data:image/svg+xml,' + encodeURIComponent(svg) + '") center/cover no-repeat}';
  },

  /* Скрипт курсор-FX для вставки в экспортируемые HTML */
  cursorScript() {
    return '<script>(function(){\n'
      + 'var svgs=[].slice.call(document.querySelectorAll("svg"));if(!svgs.length)return;\n'
      + 'svgs.forEach(function(svg){\n'
      + '  var gs=[].slice.call(svg.querySelectorAll("[data-cfg]"));if(!gs.length)return;\n'
      + '  addEventListener("pointermove",function(e){\n'
      + '    var m=svg.getScreenCTM();if(!m)return;\n'
      + '    var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;p=p.matrixTransform(m.inverse());\n'
      + '    gs.forEach(function(g){\n'
      + '      var c=JSON.parse(g.getAttribute("data-cfg"));\n'
      + '      var h=svg.querySelector("#"+c.cid+"h"),hi=svg.querySelector("#"+c.cid+"hi"),ring=svg.querySelector("#"+c.cid+"ring"),t=svg.querySelector("#"+c.cid+"t"),o=svg.querySelector("#"+c.cid+"o");\n'
      + '      if(h){h.setAttribute("cx",p.x);h.setAttribute("cy",p.y)}\n'
      + '      if(hi){hi.setAttribute("cx",p.x);hi.setAttribute("cy",p.y)}\n'
      + '      if(ring){ring.setAttribute("cx",p.x);ring.setAttribute("cy",p.y)}\n'
      + '      if(t){var k=1+c.strength/100;t.setAttribute("transform","translate("+p.x+" "+p.y+") scale("+k+") translate("+(-p.x)+" "+(-p.y)+")")}\n'
      + '      if(o)o.setAttribute("transform","translate("+p.x+" "+p.y+")");\n'
      + '    });\n'
      + '  });\n'
      + '});\n'
      + '})();<\/script>';
  },

  /* Есть ли в состоянии слой-курсор */
  hasCursorLayer(state) {
    if (!state || !state.layers) return false;
    return state.layers.some(Ly => Ly && Ly.type === 'cursor' && Ly.visible !== false);
  },

  /* Привязка курсор-FX в редакторе (на канвасе/предпросмотре).
     Один глобальный обработчик pointermove, безопасно переживает
     перерисовку канваса. */
  _cursorFxBound: false,
  bindCursorOn(root) {
    if (this._cursorFxBound) return;
    this._cursorFxBound = true;
    document.addEventListener('pointermove', function (e) {
      const svgs = root ? root.querySelectorAll('svg') : document.querySelectorAll('svg');
      svgs.forEach(function (svg) {
        const gs = svg.querySelectorAll('[data-cfg]');
        if (!gs.length) return;
        const m = svg.getScreenCTM();
        if (!m) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const p = pt.matrixTransform(m.inverse());
        gs.forEach(function (g) {
          const c = JSON.parse(g.getAttribute('data-cfg'));
          const h = svg.querySelector('#' + c.cid + 'h');
          const hi = svg.querySelector('#' + c.cid + 'hi');
          const ring = svg.querySelector('#' + c.cid + 'ring');
          const t = svg.querySelector('#' + c.cid + 't');
          const o = svg.querySelector('#' + c.cid + 'o');
          if (h) { h.setAttribute('cx', p.x); h.setAttribute('cy', p.y); }
          if (hi) { hi.setAttribute('cx', p.x); hi.setAttribute('cy', p.y); }
          if (ring) { ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y); }
          if (t) { const k = 1 + c.strength / 100; t.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') scale(' + k + ') translate(' + (-p.x) + ' ' + (-p.y) + ')'); }
          if (o) { o.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')'); }
        });
      });
    });
  }
};
