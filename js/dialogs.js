/* =========================================================
   SiteForge — CSS-диалоги (замена alert / confirm / prompt)
   Один общий оверлей, стили в css/editor.css (блок «CSS-диалоги»).
   ========================================================= */

const Dialogs = {
  _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  _ov() {
    let ov = document.getElementById('dlgOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'dlgOverlay';
      ov.className = 'dlg-overlay hidden';
      document.body.appendChild(ov);
    }
    return ov;
  },

  alert(message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      const ov = Dialogs._ov();
      ov.innerHTML = '<div class="dlg" role="dialog">'
        + '<h3>' + Dialogs._esc(opts.title || 'Уведомление') + '</h3>'
        + '<p class="dlg-msg">' + Dialogs._esc(message) + '</p>'
        + '<div class="dlg-actions"><button class="btn btn-primary" data-d="ok">Ок</button></div>'
        + '</div>';
      ov.classList.remove('hidden');
      const ok = ov.querySelector('[data-d="ok"]');
      function done() { ov.classList.add('hidden'); document.removeEventListener('keydown', key); resolve(); }
      function key(e) { if (e.key === 'Escape' || e.key === 'Enter') done(); }
      document.addEventListener('keydown', key);
      ok.onclick = done;
      ok.focus();
    });
  },

  confirm(message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      const ov = Dialogs._ov();
      ov.innerHTML = '<div class="dlg" role="dialog">'
        + '<h3>' + Dialogs._esc(opts.title || 'Подтверждение') + '</h3>'
        + '<p class="dlg-msg">' + Dialogs._esc(message) + '</p>'
        + '<div class="dlg-actions"><button class="btn" data-d="no">Отмена</button><button class="btn' + (opts.danger ? ' btn-danger' : ' btn-primary') + '" data-d="yes">' + Dialogs._esc(opts.okText || 'Ок') + '</button></div>'
        + '</div>';
      ov.classList.remove('hidden');
      const yes = ov.querySelector('[data-d="yes"]'), no = ov.querySelector('[data-d="no"]');
      function done(v) { ov.classList.add('hidden'); document.removeEventListener('keydown', key); resolve(v); }
      function key(e) { if (e.key === 'Escape') done(false); else if (e.key === 'Enter') done(true); }
      document.addEventListener('keydown', key);
      yes.onclick = function () { done(true); };
      no.onclick = function () { done(false); };
      yes.focus();
    });
  },

  prompt(message, defaultValue, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      const ov = Dialogs._ov();
      ov.innerHTML = '<div class="dlg" role="dialog">'
        + '<h3>' + Dialogs._esc(opts.title || 'Ввод') + '</h3>'
        + '<p class="dlg-msg">' + Dialogs._esc(message) + '</p>'
        + '<input class="dlg-input" data-d="val" value="' + Dialogs._esc(defaultValue == null ? '' : defaultValue) + '">'
        + '<div class="dlg-actions"><button class="btn" data-d="no">Отмена</button><button class="btn btn-primary" data-d="ok">Ок</button></div>'
        + '</div>';
      ov.classList.remove('hidden');
      const inp = ov.querySelector('[data-d="val"]'), ok = ov.querySelector('[data-d="ok"]'), no = ov.querySelector('[data-d="no"]');
      function done(v) { ov.classList.add('hidden'); document.removeEventListener('keydown', key); resolve(v); }
      function key(e) { if (e.key === 'Escape') done(null); else if (e.key === 'Enter') { e.preventDefault(); done(inp.value); } }
      document.addEventListener('keydown', key);
      ok.onclick = function () { done(inp.value); };
      no.onclick = function () { done(null); };
      inp.focus();
      inp.select();
    });
  }
};
