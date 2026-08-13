/* =========================================================
   BG·LAB — интерфейс (адаптирован для SiteForge)
   Отличия от исходного: id с префиксом bg*, добавлено
   сохранение фонов (BackgroundsLib) и список сохранённых.
   ========================================================= */

/* ---------- 8. Состояние и навигация ---------- */
var state=null, sel=0, bgSel=0, raf=0;
var stage=$('bgstage'), listEl=$('bglayers'), lookEl=$('bglookCtrls'), animEl=$('bganimCtrls'),
    lookTitle=$('bglookTitle'), animSec=$('bganimSec'), cardsEl=$('bgcards');

function openEditor(p){
  state=p.st(); sel=0; bgSel=0;
  $('bghome').classList.add('hidden');
  $('bgedit').classList.remove('hidden');
  $('bgedTitle').textContent='Редактор — '+p.name;
  refresh();
}
$('bgcreateBtn').onclick=function(){ openEditor({name:'Свой фон', st:function(){ return S({layers:[L('grid',{})]}); }}); };
$('bgback').onclick=function(){
  // «← Назад» на главной BG·LAB — возврат на главный экран конструктора
  if (window.AppController) { AppController.goHome(); }
  else { $('bgedit').classList.add('hidden'); $('bghome').classList.remove('hidden'); renderBGSaved(); }
};
$('bgback2').onclick=function(){
  // «←» в редакторе — возврат на главную BG·LAB
  $('bgedit').classList.add('hidden'); $('bghome').classList.remove('hidden'); renderBGSaved();
};

function reqRender(){
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(function(){ show(stage,state,'p'); bindCursorFX(stage); });
}
function refresh(){ renderList(); renderLook(); renderAnim(); reqRender(); }

/* карточки пресетов на главной */
PRESETS.forEach(function(p,i){
  try{
    var c=document.createElement('div'); c.className='card';
    c.innerHTML='<div class="prev"></div><div class="bar"><b>'+p.name+'</b><span>Открыть →</span></div>';
    show(c.querySelector('.prev'), p.st(), 'c'+i);
    c.onclick=function(){ openEditor(p); };
    cardsEl.appendChild(c);
  }catch(e){ console.error('preset fail:', p.name, e); }
});

/* ---------- 9. Список слоёв ---------- */
function renderList(){
  listEl.innerHTML='';
  for(var i=state.layers.length-1;i>=0;i--){
    (function(i){
      var Ly=state.layers[i], d=document.createElement('div');
      d.className='li'+(i===sel?' sel':'');
      d.innerHTML='<span>'+I[Ly.type]+' '+NAMES[Ly.type]+' '+(i+1)+'</span><span class="acts"><button data-a="eye">'+(Ly.visible?I.eye:I.eyeoff)+'</button><button data-a="up">'+I.up+'</button><button data-a="dn">'+I.dn+'</button><button data-a="rm">'+I.rm+'</button></span>';
      d.onclick=function(e){
        var b=e.target.closest('button'), a=b&&b.dataset.a;
        if(!a){ sel=i; refresh(); return; }
        if(a==='eye')Ly.visible=!Ly.visible;
        if(a==='up'&&i<state.layers.length-1){ var t1=state.layers[i]; state.layers[i]=state.layers[i+1]; state.layers[i+1]=t1; sel=i+1; }
        if(a==='dn'&&i>0){ var t2=state.layers[i]; state.layers[i]=state.layers[i-1]; state.layers[i-1]=t2; sel=i-1; }
        if(a==='rm'){ state.layers.splice(i,1); sel=state.layers.length?cl(sel,0,state.layers.length-1):'bg'; }
        refresh();
      };
      listEl.appendChild(d);
    })(i);
  }
  var bgd=document.createElement('div');
  bgd.className='li bgi'+(sel==='bg'?' sel':'');
  bgd.innerHTML='<span>'+I.bg+' Фон · градиенты</span><span style="color:#777;font-size:11px">низ</span>';
  bgd.onclick=function(){ sel='bg'; refresh(); };
  listEl.appendChild(bgd);
}
$('bgaddBtn').onclick=function(){
  state.layers.push(newLayer($('bgaddType').value));
  sel=state.layers.length-1;
  refresh();
};

/* ---------- 10. UI-хелперы ---------- */
function cw(l,k,v){ return '<div class="crow"><span>'+l+'</span><div class="cright"><input class="hex" data-ch="'+k+'" value="'+v+'" spellcheck="false"><div class="csw" data-cw="'+k+'" style="background:'+v+'"></div></div></div>'; }
function ck(a,k,l,v){ return '<div class="crow check">'+l+' <label class="sw"><input type="checkbox" data-'+a+'="'+k+'" '+(v?'checked':'')+'><i></i></label></div>'; }
function h4(t){ return '<h4>'+t+'</h4>'; }
function rw(a,k,l,mn,mx,st,v){ return '<label class="row"><span class="lbl">'+l+'</span><div class="rr"><input type="range" data-'+a+'="'+k+'" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+v+'"><input class="num" type="number" data-'+a+'n="'+k+'" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+v+'"></div></label>'; }

/* универсальная привязка ползунков/чекбоксов/селектов */
function bind(root,at,obj,after){
  root.querySelectorAll('[data-'+at+'],[data-'+at+'n],[data-'+at+'s]').forEach(function(inp){
    inp.addEventListener('input',function(){
      var k=inp.dataset[at+'n']||inp.dataset[at+'s']||inp.dataset[at];
      var v=inp.type==='checkbox'?inp.checked:(inp.tagName==='SELECT'?inp.value:parseFloat(inp.value));
      if(inp.type==='number')v=cl(v,parseFloat(inp.min),parseFloat(inp.max));
      obj[k]=v;
      var r=root.querySelector('[data-'+at+'="'+k+'"]'), n=root.querySelector('[data-'+at+'n="'+k+'"]');
      if(r&&r!==inp)r.value=v;
      if(n&&n!==inp)n.value=v;
      if(after)after(k,v);
      reqRender();
    });
  });
}

/* ---------- 11. Панель «Вид» ---------- */
function renderLook(){
  /* ==== фон ==== */
  if(sel==='bg'){
    lookTitle.textContent='Фон · градиенты';
    var b=state.bgs[bgSel];
    lookEl.innerHTML=cw('Базовый цвет','bgBase',state.bgBase)
      +'<div class="cubes" id="cubes"></div>'
      +ck('bk','on','Градиент включен',b.on)
      +cw('Цвет градиента','color',b.color)
      +rw('bk','x','Позиция X',0,100,1,b.x)
      +rw('bk','y','Позиция Y',0,100,1,b.y)
      +rw('bk','size','Размер',10,120,1,b.size)
      +rw('bk','op','Прозрачность',0,100,1,b.op);
    var cu=lookEl.querySelector('#cubes');
    state.bgs.forEach(function(g,k){
      var c=document.createElement('div');
      c.className='cube'+(k===bgSel?' sel':'')+(g.on?'':' off');
      c.style.background=g.on?g.color:'#222';
      c.onclick=function(){ bgSel=k; renderLook(); };
      cu.appendChild(c);
    });
    bind(lookEl,'bk',b,function(k){ if(k==='on')renderLook(); });
    bindColors(lookEl,function(k){ return k==='bgBase'?state:b; },function(k){ if(k==='color')renderLook(); });
    return;
  }

  lookTitle.textContent='Слой · вид';
  var Ly=state.layers[sel];
  if(!Ly){ lookEl.innerHTML='<div class="crow" style="color:#999">Нет слоёв</div>'; return; }
  var h='';

  /* картинка */
  if(Ly.type==='image'){
    h+='<label class="btn sm" style="text-align:center;cursor:pointer">Загрузить изображение<input type="file" id="imgFile" hidden accept="image/*"></label>'
      +rw('lk','scale','Масштаб',10,300,1,Ly.scale)+h4('Цветокор')
      +rw('lk','bright','Яркость',0,200,1,Ly.bright)+rw('lk','contrast','Контраст',0,200,1,Ly.contrast)
      +rw('lk','satur','Насыщенность',0,200,1,Ly.satur)+rw('lk','hueRot','Сдвиг оттенка',0,360,1,Ly.hueRot)
      +rw('lk','gray','Ч/Б',0,100,1,Ly.gray)+rw('lk','sepia','Сепия',0,100,1,Ly.sepia)+rw('lk','invert','Инверсия',0,100,1,Ly.invert);
  }

  /* фигуры */
  if(Ly.type==='shapes'){
    h+='<div class="crow">Фигура <select data-lks="shape"><option value="circle">Круг</option><option value="square">Квадрат</option><option value="tri">Треугольник</option><option value="hex">Шестигранник</option><option value="star">Звезда</option></select></div>'
      +rw('lk','count','Количество (1=центр)',1,200,1,Ly.count)
      +rw('lk','fs','Размер',4,400,1,Ly.fs)
      +rw('lk','sizeVar','Разброс размеров',0,100,1,Ly.sizeVar)
      +ck('lk','random','Случайное положение',Ly.random);
    if(Ly.random&&Ly.count>1)h+=rw('lk','chaos','Хаос положения',0,100,1,Ly.chaos);
    h+=ck('lk','outline','Контур',Ly.outline)
      +rw('lk','th','Толщина контура',1,20,.5,Ly.th)
      +rw('lk','rotRand','Разный поворот (±)',0,180,1,Ly.rotRand)
      +'<button class="btn sm" id="reroll">'+I.dice+' Перемешать</button>';
  }

  /* символы */
  if(Ly.type==='symbols'){
    h+=h4('Элементы, размер, вес')+'<div class="hint">Элемент — целиком (строка/emoji). Размер — свой у каждого. % = частота</div>';
    (Ly.elems||[]).forEach(function(e,ei){
      h+='<div class="row"><div class="rr"><input class="txt" data-elt="'+ei+'" value="'+esc(e.t)+'" style="flex:1"><input class="num" data-els="'+ei+'" min="8" max="120" value="'+(e.s!=null?e.s:(Ly.fs||26))+'"><button class="btn sm" data-elr="'+ei+'">'+I.rm+'</button></div><div class="rr"><input type="range" data-elw="'+ei+'" min="0" max="100" value="'+e.w+'"><span class="wpct" style="width:44px;text-align:right">'+e.w+'%</span></div></div>';
    });
    h+='<button class="btn sm" id="addEl">+ элемент</button>'
      +ck('lk','random','Случайное положение',Ly.random);
    if(Ly.random)h+=rw('lk','count','Количество',1,300,1,Ly.count)+rw('lk','chaos','Хаос положения',0,100,1,Ly.chaos);
    h+=ck('lk','colorMode','Цвет слоя',Ly.colorMode)
      +'<div class="hint">Выключи — emoji в родных цветах</div>'
      +ck('lk','multi','Разная скорость групп',Ly.multi)
      +'<button class="btn sm" id="reroll">'+I.dice+' Перемешать</button>';
  }

  /* курсор-FX */
  if(Ly.type==='cursor'){
    h+='<div class="crow">Эффект <select data-lks="fx"><option value="drop">Капля (линза)</option><option value="dissolve">Растворение</option><option value="glitch">Глитч</option><option value="flash">Фонарик</option><option value="invert">Инверсия</option></select></div>'
      +rw('lk','radius','Радиус',40,400,1,Ly.radius)
      +rw('lk','strength','Сила',0,100,1,Ly.strength)
      +rw('lk','soft','Мягкость краёв',0,80,1,Ly.soft);
    if(Ly.fx==='glitch')h+=rw('lk','gAmp','Сдвиг слоёв',2,40,1,Ly.gAmp)+rw('lk','gSpeed','Скорость дёргания',.2,3,.1,Ly.gSpeed);
    h+=h4('Объект на курсоре')
      +'<div class="crow">Форма <select data-lks="obj"><option value="none">Нет</option><option value="ring">Кольцо</option><option value="star">Звезда</option><option value="hex">Шестигранник</option><option value="dot">Точка</option></select></div>';
    if(Ly.obj!=='none')h+=rw('lk','objSize','Размер объекта',8,80,1,Ly.objSize)+ck('lk','objSpin','Вращение',Ly.objSpin);
    h+=cw('Цвет эффекта','color',Ly.color)+h4('Исключения')+'<div class="hint">Слои ниже, которые эффект НЕ трогает</div>';
    state.layers.forEach(function(L2,j){
      if(j>=sel)return;
      h+='<div class="crow check"><span>'+I[L2.type]+' '+NAMES[L2.type]+' '+(j+1)+'</span><label class="sw"><input type="checkbox" data-ex="'+j+'" '+((Ly.exclude||[]).includes(j)?'checked':'')+'><i></i></label></div>';
    });
  }

  /* общее для всех */
  if(Ly.type!=='image')h+=cw('Цвет','color',Ly.color);
  h+=ck('lk','neon',Ly.type==='image'?'Блум':'Неон',Ly.neon);
  if(Ly.neon&&Ly.type!=='image')h+=cw('Цвет неона','neonColor',Ly.neonColor);
  h+='<div class="crow">Блендинг <select data-lks="blend"><option>normal</option><option>screen</option><option>multiply</option><option>overlay</option><option>lighten</option></select></div>';
  if(['grid','dots','waves','symbols'].includes(Ly.type))h+=ck('lk','sync','Синхрон размера X/Y',Ly.sync);
  [
    ['size','Размер X',10,220,1,['grid','dots','stripes','waves','scan','symbols']],
    ['size2','Размер Y',6,220,1,['grid','dots','waves','symbols']],
    ['th','Толщина',1,24,.5,['grid','dots','stripes','waves','scan']],
    ['bend','Искривление',-250,250,1,['grid','waves']],
    ['op','Прозрачность',0,100,1,'all'],
    ['blur','Размытие',0,30,.5,'all'],
    ['rot','Поворот',-180,180,1,'all'],
    ['x','Смещение X',-500,500,1,'all'],
    ['y','Смещение Y',-500,500,1,'all']
  ].forEach(function(row){
    var k=row[0],lb=row[1],mn=row[2],mx=row[3],st=row[4],ty=row[5];
    if(ty!=='all'&&!ty.includes(Ly.type))return;
    h+=rw('lk',k,lb,mn,mx,st,Ly[k]);
  });
  lookEl.innerHTML=h;

  /* довыставление селектов и живые кнопки */
  var bl=lookEl.querySelector('[data-lks="blend"]'); if(bl)bl.value=Ly.blend;
  var sh=lookEl.querySelector('[data-lks="shape"]'); if(sh)sh.value=Ly.shape;
  var fx=lookEl.querySelector('[data-lks="fx"]');   if(fx)fx.value=Ly.fx;
  var ob=lookEl.querySelector('[data-lks="obj"]');  if(ob)ob.value=Ly.obj;

  var fi=lookEl.querySelector('#imgFile');
  if(fi)fi.onchange=function(){
    var f=fi.files[0]; if(!f)return;
    var rd=new FileReader();
    rd.onload=function(){ Ly.src=rd.result; reqRender(); };
    rd.readAsDataURL(f);
  };
  var rr=lookEl.querySelector('#reroll');
  if(rr)rr.onclick=function(){ Ly.seed=(Math.random()*1e9)|0; reqRender(); };

  lookEl.querySelectorAll('[data-elt]').forEach(function(inp){
    inp.addEventListener('input',function(){ Ly.elems[+inp.dataset.elt].t=inp.value; reqRender(); });
  });
  lookEl.querySelectorAll('[data-els]').forEach(function(inp){
    inp.addEventListener('input',function(){ Ly.elems[+inp.dataset.els].s=parseFloat(inp.value)||26; reqRender(); });
  });
  lookEl.querySelectorAll('[data-elw]').forEach(function(inp){
    inp.addEventListener('input',function(){
      var ei=+inp.dataset.elw; Ly.elems[ei].w=+inp.value;
      var lb=inp.parentElement.querySelector('.wpct'); if(lb)lb.textContent=inp.value+'%';
      reqRender();
    });
  });
  lookEl.querySelectorAll('[data-elr]').forEach(function(b){
    b.onclick=function(){ Ly.elems.splice(+b.dataset.elr,1); renderLook(); reqRender(); };
  });
  var ae=lookEl.querySelector('#addEl');
  if(ae)ae.onclick=function(){ Ly.elems.push({t:'A',w:50,s:26}); renderLook(); reqRender(); };

  lookEl.querySelectorAll('[data-ex]').forEach(function(inp){
    inp.addEventListener('change',function(){
      var j=+inp.dataset.ex;
      if(!Ly.exclude)Ly.exclude=[];
      if(inp.checked){ if(!Ly.exclude.includes(j))Ly.exclude.push(j); }
      else Ly.exclude=Ly.exclude.filter(function(v){ return v!==j; });
      reqRender();
    });
  });

  bind(lookEl,'lk',Ly,function(k,v){
    if(k==='neon')renderAnim();
    if(k==='random'||k==='multi'||k==='outline'||k==='obj')renderLook();
    if(Ly.sync){
      if(k==='size'){ Ly.size2=v; syncPair('size2',v); }
      if(k==='size2'){ Ly.size=v; syncPair('size',v); }
    }
    function syncPair(k2,v2){
      var a=lookEl.querySelector('[data-lk="'+k2+'"]'), b2=lookEl.querySelector('[data-lkn="'+k2+'"]');
      if(a)a.value=v2; if(b2)b2.value=v2;
    }
  });
  bindColors(lookEl,function(){ return Ly; });
}

/* ---------- 12. Редактор кривых пульсации ---------- */
function makeCurve(box,pts,cb){
  box.innerHTML='<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="'+pts.map(function(p){ return p.t+','+(100-p.v); }).join(' ')+'" fill="none" stroke="#999" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>'
    +pts.map(function(p,idx){ return '<div class="pt'+(p.lock?' locked':'')+'" data-idx="'+idx+'" style="left:'+p.t+'%;top:'+(100-p.v)+'%"></div>'; }).join('');
  box.querySelectorAll('.pt').forEach(function(el){
    var idx=+el.dataset.idx, p=pts[idx];
    el.addEventListener('pointerdown',function(ev){
      ev.preventDefault();
      var mv=function(e2){
        var r=box.getBoundingClientRect();
        if(!p.lock)p.t=Math.round(cl((e2.clientX-r.left)/r.width*100, pts[idx-1].t+2, pts[idx+1].t-2));
        p.v=Math.round(cl(100-(e2.clientY-r.top)/r.height*100, 0, 100));
        cb();
      };
      var up=function(){ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); };
      addEventListener('pointermove',mv); addEventListener('pointerup',up);
    });
    el.addEventListener('dblclick',function(){
      if(!p.lock&&pts.length>3){ pts.splice(idx,1); cb(); }
    });
  });
}
function addPoint(pts){
  var best=1, bi=1;
  for(var k=1;k<pts.length;k++){ if(pts[k].t-pts[k-1].t>best){ best=pts[k].t-pts[k-1].t; bi=k; } }
  pts.splice(bi,0,{t:Math.round((pts[bi-1].t+pts[bi].t)/2), v:Math.round((pts[bi-1].v+pts[bi].v)/2)});
}

/* ---------- 13. Панель «Анимация» ---------- */
function renderAnim(){
  if(sel==='bg'){ animSec.classList.add('hidden'); return; }
  animSec.classList.remove('hidden');
  var Ly=state.layers[sel];
  if(!Ly){ animEl.innerHTML=''; return; }
  if(Ly.type==='cursor'){ animEl.innerHTML='<div class="hint">Курсор-FX живёт от мыши. Эффект — на слои ниже, кроме исключённых.</div>'; return; }

  var dirs=[['none','Нет'],['up','Вверх'],['down','Вниз'],['left','Влево'],['right','Вправо']];
  var h=h4('Движение (одно)')
    +'<div class="pills">'+dirs.map(function(d){ return '<button data-mv="'+d[0]+'" class="'+(Ly.moveDir===d[0]?'on':'')+'">'+d[1]+'</button>'; }).join('')+'</div>'
    +rw('lk','moveSpeed','Скорость движения',1,100,1,Ly.moveSpeed)
    +h4('Дыхание')+ck('lk','breath','Включено',Ly.breath)
    +rw('lk','breathDur','Длительность, сек',.5,10,.1,Ly.breathDur)
    +rw('lk','breathAmp','Сила (масштаб %)',0,60,1,Ly.breathAmp)
    +rw('lk','breathInterval','Пауза после, сек',0,5,.1,Ly.breathInterval)
    +h4('Ролл (поворот)')
    +'<div class="pills">'+[['none','Нет'],['spin','360 по кругу'],['swing','Туда-сюда']].map(function(d){ return '<button data-rl="'+d[0]+'" class="'+(Ly.roll===d[0]?'on':'')+'">'+d[1]+'</button>'; }).join('')+'</div>'
    +rw('lk','rollDur','Секунд на оборот',.5,20,.1,Ly.rollDur);

  if(Ly.neon)h+=h4('Пульсация неона')+ck('lk','pulse','Включена',Ly.pulse)
    +rw('lk','pulseDuration','Длительность, сек',.1,8,.1,Ly.pulseDuration)
    +rw('lk','pulseInterval','Пауза после, сек',0,8,.1,Ly.pulseInterval)
    +'<div class="hint">Анимация → пауза → анимация. Кривая: X время, Y яркость</div>'
    +'<div class="curve" id="curveN"></div>'
    +'<div style="display:flex;gap:6px"><button class="btn sm" id="addN">+ точка</button><button class="btn sm" id="mirror">'+I.mirror+' Зеркало в основу</button></div>';

  h+=h4('Пульсация основы')+ck('lk','mpulse','Включена',Ly.mpulse)
    +rw('lk','mpulseDuration','Длительность, сек',.1,8,.1,Ly.mpulseDuration)
    +rw('lk','mpulseInterval','Пауза после, сек',0,8,.1,Ly.mpulseInterval)
    +'<div class="hint">В паузе держится конечное значение кривой</div>'
    +'<div class="curve" id="curveM"></div><button class="btn sm" id="addM">+ точка</button>';

  h+=h4('Искажение слоя')+rw('lk','dist','Сила',0,160,1,Ly.dist)+rw('lk','distFreq','Частота',1,40,1,Ly.distFreq)
    +ck('lk','distAnim','Анимированное',Ly.distAnim)
    +rw('lk','distDuration','Длительность волны, сек',.2,10,.1,Ly.distDuration)
    +rw('lk','distInterval','Пауза после, сек',0,8,.1,Ly.distInterval)
    +rw('lk','distAmp','Сила волны',0,160,1,Ly.distAmp)
    +h4('Дрейф цвета')+ck('lk','drift','Включен',Ly.drift)
    +'<div class="hint">Цвета дрейфа основы</div><div class="chips" id="chips"></div><button class="btn sm" id="addDrift">+ цвет</button>';
  if(Ly.neon)h+='<div class="hint">Цвета дрейфа неона</div><div class="chips" id="chipsN"></div><button class="btn sm" id="addDriftN">+ цвет</button>';
  h+=rw('lk','driftDur','Цикл дрейфа, сек',1,20,.5,Ly.driftDur);
  animEl.innerHTML=h;

  animEl.querySelectorAll('[data-mv]').forEach(function(b){ b.onclick=function(){ Ly.moveDir=b.dataset.mv; renderAnim(); reqRender(); }; });
  animEl.querySelectorAll('[data-rl]').forEach(function(b){ b.onclick=function(){ Ly.roll=b.dataset.rl; renderAnim(); reqRender(); }; });
  var rd=function(){ drawCurves(); reqRender(); };
  var aN=animEl.querySelector('#addN'); if(aN)aN.onclick=function(){ addPoint(Ly.pulseCurve); rd(); };
  var aM=animEl.querySelector('#addM'); if(aM)aM.onclick=function(){ addPoint(Ly.mpulseCurve); rd(); };
  var mir=animEl.querySelector('#mirror');
  if(mir)mir.onclick=function(){
    Ly.mpulse=true; Ly.mpulseDuration=Ly.pulseDuration; Ly.mpulseInterval=Ly.pulseInterval;
    Ly.mpulseCurve=Ly.pulseCurve.map(function(p){ return {t:p.t, v:100-p.v, lock:p.lock}; });
    renderAnim(); reqRender();
  };

  function wc(box,arr){
    if(!box)return;
    arr.forEach(function(c,ci){
      var ch=document.createElement('div'); ch.className='chip';
      ch.innerHTML='<div class="csw" style="background:'+c+'"></div><button title="убрать">'+I.rm+'</button>';
      var sw=ch.querySelector('.csw');
      attachSwatch(sw,function(){ return arr[ci]; },function(v){ arr[ci]=v; sw.style.background=v; reqRender(); });
      ch.querySelector('button').onclick=function(){ arr.splice(ci,1); renderAnim(); reqRender(); };
      box.appendChild(ch);
    });
  }
  wc(animEl.querySelector('#chips'),Ly.driftColors);
  animEl.querySelector('#addDrift').onclick=function(){ Ly.driftColors.push('#00ffc8'); renderAnim(); reqRender(); };
  wc(animEl.querySelector('#chipsN'),Ly.driftNeonColors);
  var adN=animEl.querySelector('#addDriftN');
  if(adN)adN.onclick=function(){ Ly.driftNeonColors.push('#ff00aa'); renderAnim(); reqRender(); };

  bind(animEl,'lk',Ly,function(k){ if(['pulse','mpulse','distAnim','drift'].includes(k))renderAnim(); });
  drawCurves();
}
function drawCurves(){
  var Ly=state.layers[sel];
  if(!Ly||sel==='bg')return;
  var cn=animEl.querySelector('#curveN'), cm=animEl.querySelector('#curveM');
  var rd=function(){ drawCurves(); reqRender(); };
  if(cn&&Ly.neon)makeCurve(cn,Ly.pulseCurve,rd);
  if(cm)makeCurve(cm,Ly.mpulseCurve,rd);
}

/* ---------- 14. Экспорт и сохранение ---------- */
function svgStandalone(){
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice">'+buildSVG(state,'e')+'</svg>';
}
function htmlStandalone(){
  return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Мой фон</title><style>*{margin:0;box-sizing:border-box}html,body{height:100%}.bg{position:fixed;inset:0;z-index:-1;overflow:hidden}.bg svg{width:100%;height:100%;display:block}</style></head><body><div class="bg">'+svgStandalone()+'</div>'+cursorScript()+'</body></html>';
}
function toast(t){
  var el=$('toast'); el.textContent=t; el.classList.add('show');
  setTimeout(function(){ el.classList.remove('show'); },1800);
}
function copy(t,m){
  var d=function(){ toast(m); };
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(d);
  else{
    var ta=document.createElement('textarea'); ta.value=t;
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); d();
  }
}
$('bgcopySVG').onclick=function(){ copy(svgStandalone(),'SVG скопирован ✓'); };
$('bgcopyCSS').onclick=function(){
  copy('.bg{position:fixed;inset:0;background:'+(state?state.bgBase:'#0a0a0a')+' url("data:image/svg+xml,'+encodeURIComponent(svgStandalone())+'") center/cover no-repeat}','CSS скопирован ✓');
};
$('bgcopyHTML').onclick=function(){ copy(htmlStandalone(),'HTML скопирован ✓'); };

/* ---------- 15. Сохранённые фоны ---------- */
function renderBGSaved(){
  var box=$('bgsaved');
  if(!box)return;
  var all=BackgroundsLib.getAll();
  if(!all.length){
    box.innerHTML='<div class="hint" style="padding:14px;text-align:center;border:1px dashed #3a3a3a;border-radius:12px">Пока нет сохранённых фонов. Создайте фон и нажмите «Сохранить фон».</div>';
    return;
  }
  box.innerHTML='';
  all.forEach(function(b){
    var c=document.createElement('div'); c.className='bgsaved-card';
    c.innerHTML='<div class="prev"></div><div class="bar"><b>'+esc(b.name)+'</b><span class="actions"><button data-a="del" title="Удалить">'+I.rm+'</button></span></div>';
    try{ show(c.querySelector('.prev'), b.state, 's'+b.id.replace(/[^a-zA-Z0-9]/g,'')); }catch(e){}
    c.querySelector('.prev').onclick=function(){ openSavedInEditor(b); };
    var del=c.querySelector('[data-a="del"]');
    del.onclick=function(e){
      e.stopPropagation();
      if(confirm('Удалить фон «'+b.name+'»?')){
        BackgroundsLib.remove(b.id);
        renderBGSaved();
      }
    };
    box.appendChild(c);
  });
}
function openSavedInEditor(b){
  state=JSON.parse(JSON.stringify(b.state));
  sel=0; bgSel=0;
  $('bghome').classList.add('hidden');
  $('bgedit').classList.remove('hidden');
  $('bgedTitle').textContent='Редактор — '+b.name;
  refresh();
}
$('bgsaveBtn').onclick=function(){
  if(!state){ toast('Сначала создайте фон'); return; }
  var all=BackgroundsLib.getAll();
  var name=prompt('Имя фона:', 'Фон '+(all.length+1));
  if(name&&name.trim()){
    BackgroundsLib.save(JSON.parse(JSON.stringify(state)), name.trim());
    renderBGSaved();
    toast('Фон сохранён ✓');
  }
};

/* глобальные функции для AppController */
window.renderBGSaved = renderBGSaved;
window.openSavedInEditor = openSavedInEditor;

window.BGLAB_OK=1;
