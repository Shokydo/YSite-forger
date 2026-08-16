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

  /* Обновить состояние уже сохранённого фона (in-place) */
  update(id, state) {
    const all = this.getAll();
    const b = all.find(x => String(x.id) === String(id));
    if (b) {
      b.state = JSON.parse(JSON.stringify(state));
      this._persist(all);
      return b;
    }
    return null;
  },

  _persist(all) {
    try {
      localStorage.setItem(this._key, JSON.stringify(all));
    } catch (e) {
      console.warn('BackgroundsLib: не удалось сохранить в localStorage', e);
    }
  },

  /* ---------- Сборка SVG/HTML ---------- */
  svgFor(state, uid, skipLive) {
    if (!state) return '';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">' + buildSVG(state, uid, skipLive) + '</svg>';
  },

  /* Встраиваемый слой фона (для секции / страницы) */
  layerHtml(state, uid) {
    if (!state) return '';
    return '<div class="bg-embed">' + this.svgFor(state, uid) + '</div>';
  },

  /* Полный HTML-файл фона (как копия из BG·LAB) */
  htmlFor(state) {
    if (!state) return '';
    const cfg = this.particlesCfg(state);
    const px = cfg ? ' data-plex=\'' + esc(JSON.stringify(cfg)) + '\'' : '';
    const skip = cfg ? true : false;
    return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Мой фон</title><style>*{margin:0;box-sizing:border-box}html,body{height:100%}.bg{position:fixed;inset:0;z-index:-1;overflow:hidden}.bg svg{width:100%;height:100%;display:block}</style></head><body><div class="bg"' + px + '>' + this.svgFor(state, 'e', skip) + '</div>' + this.cursorScript() + (cfg ? this.particlesScript() : '') + '</body></html>';
  },

  /* CSS-правило для фона в виде data-uri (живой режим невозможен — статика) */
  cssFor(state) {
    if (!state) return '';
    const svg = this.svgFor(state, 'e', false);
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
      + '      if(c.sp){var gd=svg.querySelector("#"+c.cid);if(gd){gd.setAttribute("cx",p.x);gd.setAttribute("cy",p.y)}}\n'
      + '      if(c.pc){var sgn=c.repel?-0.35:0.35;g.setAttribute("transform","translate("+((p.x-'+(W/2)+')*sgn).toFixed(1)+" "+((p.y-'+(H/2)+')*sgn).toFixed(1)+")")}\n'
      + '    });\n'
      + '  });\n'
      + '});\n'
      + '})();<\/script>';
  },

  /* Есть ли в состоянии слой-курсор */

  /* Конфиг первого живого particles-слоя или null */
  particlesCfg(state) {
    if (!state || !state.layers) return null;
    for (let i = 0; i < state.layers.length; i++) {
      const l = state.layers[i];
      if (l && l.type === 'particles' && l.visible !== false && l.live) {
        return {
          color: l.color || '#cccccc',
          count: l.count || 140,
          distance: l.distance || 130,
          speed: l.speed != null ? l.speed : 0.4,
          cursorR: l.cursorR || 150,
          strength: l.strength || 50,
          lineOp: l.lineOp != null ? l.lineOp : 0.2,
          cursor: l.cursor || 'none',
          linkPulse: l.linkPulse || 0,
          linkPulseSpeed: l.linkPulseSpeed != null ? l.linkPulseSpeed : 1.5,
          dotPulse: l.dotPulse || 0,
          colorCycle: l.colorCycle || 0
        };
      }
    }
    return null;
  },

  /* Скрипт живого плексуса для вставки в экспортируемые HTML */
  particlesScript() {
    const fn = String(plexusFrame).replace(/<\/script>/g, '<\\/script>');
    return '<script>(function(){\n'
      + 'function cl(v,a,b){v=+v;return v<a?a:v>b?b:v}\n'
      + 'function rgbStr(h){h=String(h||"#cccccc").replace("#","");if(h.length===3)h=h.split("").map(function(c){return c+c}).join("");if(h.length<6)return "204,204,204";return parseInt(h.slice(0,2),16)+","+parseInt(h.slice(2,4),16)+","+parseInt(h.slice(4,6),16)}\n'
      + 'function hexToHsv(x){var p=hexToRgb(x);return rgbToHsv(p[0],p[1],p[2])}\n'
      + 'function hexToRgb(x){x=String(x).replace("#","");if(x.length===3)x=x.split("").map(function(c){return c+c}).join("");var n=parseInt(x,16);return[n>>16&255,n>>8&255,n&255]}\n'
      + 'function rgbToHsv(r,g,b){r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0;if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360}return{h:h,s:mx?d/mx:0,v:mx}}\n'
      + 'function hsvToRgb(h,s,v){var c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;var p=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return[(p[0]+m)*255,(p[1]+m)*255,(p[2]+m)*255]}\n'
      + 'var PLEX=' + fn + '\n'
      + 'var bg=document.querySelector(".bg[data-plex]");if(!bg)return;\n'
      + 'var o=JSON.parse(bg.getAttribute("data-plex"));o.max=4;o.rgb=rgbStr(o.color);\n'
      + 'var cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none";bg.appendChild(cv);\n'
      + 'var ctx=cv.getContext("2d"),P=[],mouse={x:-1e5,y:-1e5},r0=bg.getBoundingClientRect(),d0=window.devicePixelRatio||1;\n'
      + 'cv.width=Math.max(1,Math.round(r0.width*d0));cv.height=Math.max(1,Math.round(r0.height*d0));\n'
      + 'for(var k=0;k<o.count;k++)P.push({x:Math.random()*Math.max(400,r0.width),y:Math.random()*Math.max(300,r0.height),vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,r:1+Math.random()*1.5});\n'
      + 'var vis=true;document.addEventListener("visibilitychange",function(){vis=!document.hidden});\n'
      + 'addEventListener("pointermove",function(e){mouse.x=e.clientX;mouse.y=e.clientY});\n'
      + 'addEventListener("pointerleave",function(){mouse.x=-1e5;mouse.y=-1e5});\n'
      + '(function f(){if(vis){var r=bg.getBoundingClientRect(),d=window.devicePixelRatio||1;if(cv.width!==Math.round(r.width*d)||cv.height!==Math.round(r.height*d)){cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d)}PLEX(ctx,P,o,mouse,r.width,r.height,d,performance.now()/1000)}requestAnimationFrame(f)})();\n'
      + '})();<\/script>';
  },
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
