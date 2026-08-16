/* =========================================================
   BG·LAB — интерфейс (адаптирован для SiteForge)
   Отличия от исходного: id с префиксом bg*, добавлено
   сохранение фонов (BackgroundsLib) и список сохранённых.
   ========================================================= */

/* ---------- 8. Состояние и навигация ---------- */
var state=null, sel=0, bgSel=0, raf=0, lastShow=0;
var bgEditId=null;
function setSaveLabel(){
  var lb=$('bgsaveLabel'); if(!lb)return;
  lb.textContent=bgEditId?'Сохранить изменения':'Сохранить фон';
  var btn=$('bgsaveBtn'); if(btn)btn.title=bgEditId?'Обновить текущий фон':'Создать новый фон';
}
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
  bgEditId=null; setSaveLabel();
  if (window.AppController) { AppController.goHome(); }
  else { $('bgedit').classList.add('hidden'); $('bghome').classList.remove('hidden'); renderBGSaved(); }
};
$('bgback2').onclick=function(){
  // «←» в редакторе — возврат на главную BG·LAB
  bgEditId=null; setSaveLabel();
  $('bgedit').classList.add('hidden'); $('bghome').classList.remove('hidden'); renderBGSaved();
};

function reqRender(){
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(function f(){
    var n=performance.now();
    if(n-lastShow<33){ raf=requestAnimationFrame(f); return; }
    lastShow=n;
    show(stage,state,'p',true); renderPropsPrev(); bindCursorFX(stage); bindParticlesLive(stage);
  });
}
function refresh(){ renderList(); renderLook(); renderAnim(); reqRender(); }

/* живой плексус: canvas-оверлей поверх сцены (первый живой particles-слой) */
function bindParticlesLive(root){
  if(!state)return;
  var Ly=null;
  for(var i=0;i<state.layers.length;i++){
    var l=state.layers[i];
    if(l&&l.type==='particles'&&l.visible!==false&&l.live){Ly=l;break;}
  }
  var cv=root._plexCanvas;
  if(!Ly){
    if(cv){if(cv.parentNode)cv.parentNode.removeChild(cv);root._plexCanvas=null;root._plexCtx=null;}
    return;
  }
  if(!cv||cv.parentNode!==root){
    if(cv&&cv.parentNode)cv.parentNode.removeChild(cv);
    cv=document.createElement('canvas');
    cv.className='plex-canvas';
    root.appendChild(cv);
    root._plexCanvas=cv;
    root._plexCtx=cv.getContext('2d');
    if(!root._plex)root._plex={mouse:{x:-1e5,y:-1e5}};
  }
  var n=cl(Ly.count||140,2,200);
  if(!root._plexP||root._plexP.length!==n){
    root._plexP=[];
    var rnd=mulberry32((Ly.seed||7)+555),r0=root.getBoundingClientRect();
    var bw=Math.max(400,r0.width)||400,bh=Math.max(300,r0.height)||300;
    for(var k=0;k<n;k++)root._plexP.push({x:rnd()*bw,y:rnd()*bh,vx:(rnd()-.5)*2,vy:(rnd()-.5)*2,r:(Ly.fs||3)*(.5+rnd()*.35)});
  }
  root._plex.P=root._plexP;
  root._plex.o={cursorR:Ly.cursorR||150,strength:Ly.strength||50,lineOp:Ly.lineOp!=null?Ly.lineOp:.2,distance:Ly.distance||140,speed:Ly.speed!=null?Ly.speed:.4,max:4,cursor:Ly.cursor||'none',color:Ly.color||'#cccccc',rgb:rgbStr(Ly.color||'#cccccc'),linkPulse:Ly.linkPulse||0,linkPulseSpeed:Ly.linkPulseSpeed!=null?Ly.linkPulseSpeed:1.5,dotPulse:Ly.dotPulse||0};
  if(!root._plexRaf){
    var vis=true;
    document.addEventListener('visibilitychange',function(){vis=!document.hidden;});
    function frame(){
      var cv2=root._plexCanvas,cx=root._plexCtx,s=root._plex;
      if(vis&&cv2&&cx&&s&&s.P){
        var r=root.getBoundingClientRect(),d=window.devicePixelRatio||1;
        if(cv2.width!==Math.round(r.width*d)||cv2.height!==Math.round(r.height*d)){cv2.width=Math.round(r.width*d);cv2.height=Math.round(r.height*d);}
        plexusFrame(cx,s.P,s.o,s.mouse,r.width,r.height,d,performance.now()/1000);
      }
      root._plexRaf=requestAnimationFrame(frame);
    }
    root._plexRaf=requestAnimationFrame(frame);
  }
  if(!root._plexPtr){
    root._plexPtr=function(e){
      var s=root._plex;if(!s)return;
      var r=root.getBoundingClientRect();
      s.mouse.x=e.clientX-r.left;s.mouse.y=e.clientY-r.top;
    };
    root._plexLeave=function(){var s=root._plex;if(s){s.mouse.x=-1e5;s.mouse.y=-1e5;}};
    root.addEventListener('pointermove',root._plexPtr);
    root.addEventListener('pointerleave',root._plexLeave);
  }
}

/* карточки пресетов на главной — бесконечная лента */
var trackEl=document.createElement('div'); trackEl.id='bgcardsTrack'; cardsEl.appendChild(trackEl);
function buildCard(p,uid){
  var c=document.createElement('div'); c.className='card';
  c.innerHTML='<div class="prev"></div><div class="bar"><b>'+p.name+'</b><span>Открыть →</span></div>';
  try{ show(c.querySelector('.prev'), p.st(), uid); }catch(e){ console.error('preset fail:', p.name, e); }
  c.onclick=function(){ openEditor(p); };
  return c;
}
var copyA=document.createElement('div'), copyB=document.createElement('div');
copyA.className='bgcards-copy'; copyB.className='bgcards-copy';
PRESETS.forEach(function(p,i){
  copyA.appendChild(buildCard(p,'cA'+i));
  copyB.appendChild(buildCard(p,'cB'+i));
});
trackEl.appendChild(copyA); trackEl.appendChild(copyB);

/* движок ленты: авто-прокрутка + колесо, бесконечный цикл */
var autoPlay=true, pos=0, speed=0.45;
cardsEl.addEventListener('mouseenter', function(){ autoPlay=false; });
cardsEl.addEventListener('mouseleave', function(){ autoPlay=true; });
cardsEl.addEventListener('wheel', function(e){
  if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){
    e.preventDefault();
    autoPlay=false;
    pos-=e.deltaY;
    wrapPos();
    trackEl.style.transform='translate3d('+pos+'px,0,0)';
  }
},{passive:false});
function wrapPos(){
  var w=copyA.offsetWidth; if(!w)return;
  while(pos<=-w)pos+=w;
  while(pos>0)pos-=w;
}
function marquee(){
  var vw=$('view-bglab'), vh=$('bghome');
  var vis=!vw.classList.contains('hidden')&&!vh.classList.contains('hidden');
  if(vis&&autoPlay)pos-=speed;
  wrapPos();
  trackEl.style.transform='translate3d('+pos+'px,0,0)';
  requestAnimationFrame(marquee);
}
if(PRESETS.length){ marquee(); }

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

/* превью выбранного слоя в правой панели */
function renderPropsPrev(){
  var pv=$('bgpropsPrev'); if(!pv)return;
  var wrap=function(s){ return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice">'+s+'</svg>'; };
  if(sel==='bg'){
    pv.innerHTML='<span class="pp-tag">Фон · градиенты</span>'+wrap(buildSVG({bgBase:state.bgBase,bgs:state.bgs,layers:[]},'pfbg'));
    return;
  }
  var Ly=state.layers[sel];
  if(!Ly){ pv.innerHTML='<span class="pp-tag">Нет слоя</span>'; return; }
  pv.innerHTML='<span class="pp-tag">'+esc(NAMES[Ly.type]+' '+(sel+1))+'</span>'+wrap(buildSVG({bgBase:'#0d0d0d',bgs:[{on:false,color:'#000',x:50,y:50,size:60,op:0}],layers:[Ly]},'pp'+sel));
}

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

  var Ly=state.layers[sel];
  if(!Ly){ lookEl.innerHTML='<div class="crow" style="color:#999">Нет слоёв</div>'; return; }
  lookTitle.textContent='Слой · вид — '+NAMES[Ly.type]+' '+(sel+1);
  var h='';

  /* картинка */
  if(Ly.type==='image'){
    h+='<label class="btn sm" style="text-align:center;cursor:pointer">Загрузить изображение<input type="file" id="imgFile" hidden accept="image/*"></label>'
      +ck('lk','tileOn','Плитка (повтор по экрану)',Ly.tileOn)
      +(Ly.tileOn?rw('lk','tileSize','Размер плитки',80,400,1,Ly.tileSize):'')
      +rw('lk','scale','Масштаб',10,300,1,Ly.scale)+h4('Цветокор')
      +rw('lk','bright','Яркость',0,200,1,Ly.bright)+rw('lk','contrast','Контраст',0,200,1,Ly.contrast)
      +rw('lk','satur','Насыщенность',0,200,1,Ly.satur)+rw('lk','hueRot','Сдвиг оттенка',0,360,1,Ly.hueRot)
      +rw('lk','gray','Ч/Б',0,100,1,Ly.gray)+rw('lk','sepia','Сепия',0,100,1,Ly.sepia)+rw('lk','invert','Инверсия',0,100,1,Ly.invert);
  }

  /* фигуры */
  if(Ly.type==='shapes'){
    h+='<div class="crow">Фигура <select data-lks="shape"><option value="circle">Круг</option><option value="square">Квадрат</option><option value="tri">Треугольник</option><option value="hex">Шестигранник</option><option value="star">Звезда</option><option value="ring">Кольцо</option><option value="drop">Капля</option></select></div>'
      +(Ly.shape==='ring'?rw('lk','ringTh','Толщина кольца',10,90,1,(Ly.ringTh==null?60:Ly.ringTh)):'')
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

  /* сборка фигур */
  if(Ly.type==='group'){
    h+='<button class="btn sm" id="grpOpen">'+I.grp+' Открыть редактор сборки</button>'
      +'<div class="hint">Слой рисует собранную фигуру из символов целиком</div>'
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
    h+=h4('Элементы, размер, вес')+'<div class="hint">Элемент — целиком (строка/emoji). Размер и вращение — свои у каждого. % = частота</div>';
    (Ly.elems||[]).forEach(function(e,ei){
      var isGrp=e.mode==='grp';
      h+='<div class="row erow">'
        +'<div class="rr" style="justify-content:space-between">'
        +'<b style="opacity:.7;font-size:12px">#'+(ei+1)+'</b>'
        +'<select data-elm="'+ei+'" style="width:110px" title="Тип элемента"><option value="std"'+(isGrp?'':' selected')+'>Символ</option><option value="grp"'+(isGrp?' selected':'')+'>Сборка</option></select>'
        +'<span style="display:flex;gap:6px"><button class="btn sm" data-elg="'+ei+'" title="Редактировать сборку"'+(isGrp?'':' style="display:none"')+'>'+I.grp+' Настройка</button><button class="btn sm" data-elr="'+ei+'" title="Удалить">'+I.rm+'</button></span>'
        +'</div>'
        +(isGrp?'':'<div class="rr"><input class="txt" data-elt="'+ei+'" value="'+esc(e.t)+'" style="flex:1" title="Символ/текст"><input class="num" data-els="'+ei+'" min="8" max="120" value="'+(e.s!=null?e.s:(Ly.fs||26))+'" title="Размер"></div>')
        +'<div class="rr"><input type="range" data-elw="'+ei+'" min="0" max="100" value="'+e.w+'"><span class="wpct" style="width:44px;text-align:right">'+e.w+'%</span></div>'
        +'<div class="rr"><span class="hint" style="width:52px">Вращ.</span><select data-elrm="'+ei+'" style="flex:1"><option value="none"'+(e.r==='none'||!e.r?' selected':'')+'>Нет</option><option value="spin"'+(e.r==='spin'?' selected':'')+'>По кругу</option><option value="swing"'+(e.r==='swing'?' selected':'')+'>Туда-сюда</option></select><select data-elrd="'+ei+'" style="width:60px" title="Направление вращения"><option value="cw"'+(e.rd!=='ccw'?' selected':'')+'>↻</option><option value="ccw"'+(e.rd==='ccw'?' selected':'')+'>↺</option></select><input class="num" data-elrs="'+ei+'" style="width:58px" min="0.5" max="20" step="0.1" value="'+(e.rs!=null?e.rs:6)+'" title="сек/оборот"></div></div>';
    });
    h+='<div class="rr"><button class="btn sm" id="addEl">+ символ</button><button class="btn sm" id="addElGrp">+ сборка</button></div>'
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

  /* сеть частиц */
  if(Ly.type==='particles'){
    h+='<div class="crow">Режим <select data-lks="live"><option value="0">Статика (SVG)</option><option value="1">Живой (canvas)</option></select></div>'
      +'<div class="crow">Курсор <select data-lks="cursor"><option value="none">Нет</option><option value="grab">Grab-линии</option><option value="repel">Отталкивание</option><option value="attract">Притяжение</option><option value="grab+repel">Grab+отталкивание</option><option value="grab+attract">Grab+притяжение</option></select></div>'
      +rw('lk','count','Частиц',20,200,1,Ly.count)
      +rw('lk','distance','Радиус связи',50,300,1,Ly.distance)
      +rw('lk','fs','Размер точки',1,12,.5,Ly.fs)
      +rw('lk','speed','Скорость',0,2,.1,Ly.speed)
      +rw('lk','cursorR','Радиус курсора',50,400,1,Ly.cursorR)
      +rw('lk','strength','Сила',0,100,1,Ly.strength)
      +rw('lk','lineOp','Яркость линий',.05,.6,.05,Ly.lineOp)
      +h4('Анимации сети')
      +rw('lk','linkPulse','Пульс линий',0,100,1,Ly.linkPulse)
      +rw('lk','linkPulseSpeed','Скорость пульса',.2,5,.1,Ly.linkPulseSpeed)
      +rw('lk','dotPulse','Пульс точек',0,100,1,Ly.dotPulse)
      +'<div class="hint">Работает в живом режиме (canvas). Цвет меняйте драгом кубика цвета</div>'
      +'<button class="btn sm" id="reroll">'+I.dice+' Перемешать</button>';
  }

  /* старый монитор */
  if(Ly.type==='crt'){
    h+=rw('lk','scanlineHeight','Высота полосы',1,4,1,Ly.scanlineHeight)
      +rw('lk','scanlineAlpha','Непрозрачность полос',.05,.5,.05,Ly.scanlineAlpha)
      +rw('lk','glitchFrequency','Частота сбоев, сек',0,2,.1,Ly.glitchFrequency)
      +'<div class="hint">Сканлайны + периодический глитч-дрожание сигнала</div>';
  }

  /* прожектор */
  if(Ly.type==='spotlight'){
    h+=ck('lk','invert','Инверсия (тьма вокруг курсора)',Ly.invert)
      +rw('lk','radius','Радиус',50,500,1,Ly.radius)
      +rw('lk','soft','Растушёвка края',0,100,1,Ly.soft)
      +'<div class="hint">Курсор — прожектор. Работает и в экспорте</div>';
  }

  /* матрица */
  if(Ly.type==='terminal'){
    h+='<label class="row"><span class="lbl">Символы</span><div class="rr"><input class="txt" data-lkst="chars" value="'+esc(Ly.chars||'0123456789ABCDEF')+'" style="flex:1"></div></label>'
      +rw('lk','fs','Размер шрифта',8,120,1,Ly.fs)
      +rw('lk','speed','Скорость падения',1,10,1,Ly.speed)
      +rw('lk','trailFade','Хвост (затухание)',.05,.3,.05,Ly.trailFade);
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
    ['th','Толщина',1,24,.5,['grid','dots','stripes','waves','scan','particles']],
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
  var ms=lookEl.querySelector('[data-lks="mouse"]');if(ms)ms.value=Ly.mouse||'none';
  var lv=lookEl.querySelector('[data-lks="live"]'); if(lv)lv.value=Ly.live?'1':'0';
  var cu=lookEl.querySelector('[data-lks="cursor"]');if(cu)cu.value=Ly.cursor||'none';

  var fi=lookEl.querySelector('#imgFile');
  if(fi)fi.onchange=function(){
    var f=fi.files[0]; if(!f)return;
    var rd=new FileReader();
    rd.onload=function(){ Ly.src=rd.result; reqRender(); };
    rd.readAsDataURL(f);
  };
  var rr=lookEl.querySelector('#reroll');
  if(rr)rr.onclick=function(){ Ly.seed=(Math.random()*1e9)|0; reqRender(); };
  var go=lookEl.querySelector('#grpOpen');
  if(go)go.onclick=function(){ openGroupEditor(); };

  lookEl.querySelectorAll('[data-lkst]').forEach(function(inp){
    inp.addEventListener('input',function(){ Ly[inp.dataset.lkst]=inp.value; reqRender(); });
  });

  lookEl.querySelectorAll('[data-elt]').forEach(function(inp){
    inp.addEventListener('input',function(){ Ly.elems[+inp.dataset.elt].t=inp.value; reqRender(); });
  });
  lookEl.querySelectorAll('[data-els]').forEach(function(inp){
    inp.addEventListener('input',function(){ Ly.elems[+inp.dataset.els].s=parseFloat(inp.value)||26; reqRender(); });
  });
  lookEl.querySelectorAll('[data-elrm]').forEach(function(inp){
    inp.addEventListener('change',function(){ Ly.elems[+inp.dataset.elrm].r=inp.value; reqRender(); });
  });
  lookEl.querySelectorAll('[data-elrd]').forEach(function(inp){
    inp.addEventListener('change',function(){ Ly.elems[+inp.dataset.elrd].rd=inp.value; reqRender(); });
  });
  lookEl.querySelectorAll('[data-elrs]').forEach(function(inp){
    inp.addEventListener('input',function(){ Ly.elems[+inp.dataset.elrs].rs=parseFloat(inp.value)||6; reqRender(); });
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
  lookEl.querySelectorAll('[data-elm]').forEach(function(inp){
    inp.addEventListener('change',function(){
      var e=Ly.elems[+inp.dataset.elm]; e.mode=inp.value;
      if(e.mode==='grp'&&!e.g)e.g=defGroup();
      renderLook(); reqRender();
    });
  });
  lookEl.querySelectorAll('[data-elg]').forEach(function(b){
    b.onclick=function(){ openGroupEditor(+b.dataset.elg); };
  });
  var ae=lookEl.querySelector('#addEl');
  if(ae)ae.onclick=function(){ Ly.elems.push({t:'A',w:50,s:26,r:'none',rs:6,rd:'cw',mode:'std'}); renderLook(); reqRender(); };
  var ag=lookEl.querySelector('#addElGrp');
  if(ag)ag.onclick=function(){ Ly.elems.push({t:'A',w:50,s:40,r:'none',rs:6,rd:'cw',mode:'grp',g:defGroup()}); renderLook(); reqRender(); };

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
    if(k==='live')Ly.live=v==='1';
    if(k==='neon')renderAnim();
    if(k==='random'||k==='multi'||k==='outline'||k==='obj'||k==='tileOn'||k==='shape')renderLook();
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
    +'<div class="pills">'+[['cw','↻ По часовой'],['ccw','↺ Против']].map(function(d){ return '<button data-rld="'+d[0]+'" class="'+(Ly.rollDir===d[0]?'on':'')+'">'+d[1]+'</button>'; }).join('')+'</div>'
    +rw('lk','rollDur','Секунд на оборот',.5,20,.1,Ly.rollDur);

  if(['shapes','image','group'].indexOf(Ly.type)>=0){
    h+=h4('Вращение элементов')
      +'<div class="hint">Каждая фигура/плитка крутится вокруг своей оси</div>'
      +'<div class="pills">'+[['none','Нет'],['spin','По кругу'],['swing','Туда-сюда']].map(function(d){ return '<button data-sp="'+d[0]+'" class="'+(Ly.spin===d[0]?'on':'')+'">'+d[1]+'</button>'; }).join('')+'</div>'
      +'<div class="pills">'+[['cw','↻ По часовой'],['ccw','↺ Против']].map(function(d){ return '<button data-spd="'+d[0]+'" class="'+(Ly.spinDir===d[0]?'on':'')+'">'+d[1]+'</button>'; }).join('')+'</div>'
      +rw('lk','spinDur','Секунд на оборот',.5,20,.1,Ly.spinDur);
  }

  if(['symbols','shapes','image','group'].indexOf(Ly.type)>=0){
    h+=h4('Хаотичное движение')
      +'<div class="hint">Каждый элемент блуждает по своему случайному пути</div>'
      +rw('lk','chAmp','Сила (разброс)',0,100,1,Ly.chAmp)
      +rw('lk','chSpeed','Скорость',1,100,1,Ly.chSpeed);
  }

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
  animEl.querySelectorAll('[data-rld]').forEach(function(b){ b.onclick=function(){ Ly.rollDir=b.dataset.rld; renderAnim(); reqRender(); }; });
  animEl.querySelectorAll('[data-sp]').forEach(function(b){ b.onclick=function(){ Ly.spin=b.dataset.sp; renderAnim(); reqRender(); }; });
  animEl.querySelectorAll('[data-spd]').forEach(function(b){ b.onclick=function(){ Ly.spinDir=b.dataset.spd; renderAnim(); reqRender(); }; });
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
function svgStandalone(skipLive){
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice">'+buildSVG(state,'e',skipLive)+'</svg>';
}
function htmlStandalone(){
  var cfg=typeof BackgroundsLib!=='undefined'?BackgroundsLib.particlesCfg(state):null;
  var px=cfg?' data-plex=\''+esc(JSON.stringify(cfg))+'\'':'';
  return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Мой фон</title><style>*{margin:0;box-sizing:border-box}html,body{height:100%}.bg{position:fixed;inset:0;z-index:-1;overflow:hidden}.bg svg{width:100%;height:100%;display:block}</style></head><body><div class="bg"'+px+'>'+svgStandalone(!!cfg)+'</div>'+(typeof BackgroundsLib!=='undefined'?BackgroundsLib.cursorScript():'')+(cfg&&typeof BackgroundsLib!=='undefined'?BackgroundsLib.particlesScript():'')+'</body></html>';
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
$('bgcopyCSS').onclick=function(){
  var m='CSS скопирован ✓';
  if(typeof BackgroundsLib!=='undefined'&&BackgroundsLib.particlesCfg(state))m='Живой режим в CSS не экспортируется — вставлена статика ✓';
  copy('.bg{position:fixed;inset:0;background:'+(state?state.bgBase:'#0a0a0a')+' url("data:image/svg+xml,'+encodeURIComponent(svgStandalone())+'") center/cover no-repeat}',m);
};
$('bgcopyHTML').onclick=function(){ copy(htmlStandalone(),'HTML скопирован ✓'); };

/* ---------- 14b. Предпросмотр фона на весь экран ---------- */
$('bgprevBtn').onclick=function(){
  if(!state){ toast('Сначала создайте фон'); return; }
  var fr=$('bgpreviewFrame');
  try{ fr.srcdoc=htmlStandalone(); }
  catch(e){ toast('Не удалось собрать превью'); return; }
  $('bgpreview').classList.remove('hidden');
};
$('bgprevExit').onclick=function(){
  $('bgpreview').classList.add('hidden');
  var fr=$('bgpreviewFrame'); fr.srcdoc='';
};

/* ---------- 14b. Редактор сборки (элемент символов или слой) ---------- */
var grpCtx={kind:'layer'};
function grpHost(){
  if(!state||!state.layers[sel])return null;
  if(grpCtx&&grpCtx.kind==='el'){
    var Ly=state.layers[sel];
    if(Ly.type!=='symbols'||!Ly.elems||!Ly.elems[grpCtx.ei])return null;
    return Ly.elems[grpCtx.ei];
  }
  return state.layers[sel];
}
function openGroupEditor(ei){
  if(!state||!state.layers[sel])return;
  grpCtx=ei!=null?{kind:'el',ei:ei,selPart:0}:{kind:'layer',selPart:0};
  var host=grpHost();
  if(!host)return;
  var g=host.g&&host.g.length?host.g:defGroup();
  host.g=g.map(function(p){
    if(p.ty==='t')return p;
    return {ty:'t',x:p.x!=null?p.x:50,y:p.y!=null?p.y:50,ch:'A',fs:p.fs||Math.max(p.rx||20,p.ry||20),rot:p.rot||0};
  });
  if(grpCtx.selPart==null||!host.g[grpCtx.selPart])grpCtx.selPart=0;
  var T=$('bgGroupTitle');
  if(T)T.textContent=grpCtx.kind==='el'
    ?'Редактор сборки — '+NAMES.symbols+' '+(sel+1)+' · Элемент #'+(grpCtx.ei+1)
    :'Редактор сборки — слой '+(sel+1)+' ('+(NAMES.symbols||'Символы')+')';
  renderPartsBar(); renderPartPanel(); renderGroupPreview();
  $('bgGroupOverlay').classList.remove('hidden');
}
/* превью 0..100: каждая часть в <g data-gi>, выбранная подсвечена */
function gpartBox(p){
  var fs=p.fs!=null?p.fs:20;
  return {rx:1+(fs/2)*(p.sx!=null?p.sx:1),ry:1+(fs*0.65/2)*(p.sy!=null?p.sy:1)};
}
function renderGroupPreview(){
  var host=grpHost(), box=$('bgGroupPreview');
  if(!host||!box)return;
  var g=host.g||[];
  if(!g.length){ box.innerHTML='<div class="hint" style="padding:14px;text-align:center;color:#999">Пусто. Добавьте символ.</div>'; return; }
  try{
    var t='<svg viewBox="0 0 100 100"><g transform="translate(50 50)">'+groupContent(g,100,'#fff',false,function(p,i){
      var b=gpartBox(p);
      var tr='transform="translate('+((p.x!=null?p.x:50)-50).toFixed(2)+' '+((p.y!=null?p.y:50)-50).toFixed(2)+') rotate('+(p.rot||0)+') scale('+(p.sx!=null?p.sx:1)+' '+(p.sy!=null?p.sy:1)+')"';
      var hit='<rect x="'+(-b.rx)+'" y="'+(-b.ry)+'" width="'+(b.rx*2)+'" height="'+(b.ry*2)+'" fill="rgba(74,158,255,0.05)" stroke="rgba(74,158,255,0.3)" '+tr+'/>';
      var post='</g>';
      if(i===grpCtx.selPart)post='<rect x="'+(-b.rx)+'" y="'+(-b.ry)+'" width="'+(b.rx*2)+'" height="'+(b.ry*2)+'" fill="none" stroke="#4a9eff" stroke-width="0.7" stroke-dasharray="2 1.6" '+tr+'/>'+post;
      return ['<g data-gi="'+i+'" style="cursor:pointer">'+hit,post];
    })+'</svg>';
    var svg=box.querySelector('svg');
    if(svg){ svg.innerHTML=t.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,''); }
    else{ box.innerHTML=t; bindGroupPreview(box); }
  }catch(e){ box.innerHTML='<div class="hint" style="padding:14px;text-align:center;color:#999">Ошибка превью</div>'; }
}
/* клик = выбор части, drag = движение в координатах 0..100 */
function bindGroupPreview(box){
  var svg=box.querySelector('svg');
  if(!svg||svg._gb)return;
  svg._gb=1;
  function toXY(e){
    var r=svg.getBoundingClientRect();
    return {x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};
  }
  svg.addEventListener('pointerdown',function(e){
    var host=grpHost(); if(!host)return;
    var g=host.g||[];
    var gi=null, el=e.target;
    while(el&&el!==svg){ if(el.getAttribute&&el.getAttribute('data-gi')!=null){ gi=+el.getAttribute('data-gi'); break; } el=el.parentNode; }
    if(gi!=null&&g[gi]){
      grpCtx.selPart=gi;
      renderPartsBar(); renderPartPanel(); renderGroupPreview();
    }
    if(grpCtx.selPart==null||!g[grpCtx.selPart])return;
    if(gi==null)return;
    e.preventDefault();
    var p=g[grpCtx.selPart];
    var st=toXY(e);
    var dx0=st.x-(p.x!=null?p.x:50), dy0=st.y-(p.y!=null?p.y:50);
    try{ svg.setPointerCapture(e.pointerId); }catch(err){}
    function mv(e2){
      var q=toXY(e2);
      p.x=Math.max(0,Math.min(100,q.x-dx0));
      p.y=Math.max(0,Math.min(100,q.y-dy0));
      renderGroupPreview(); renderPartPanel(); reqRender();
    }
    function up(){
      svg.removeEventListener('pointermove',mv);
      svg.removeEventListener('pointerup',up);
      svg.removeEventListener('pointercancel',up);
    }
    svg.addEventListener('pointermove',mv);
    svg.addEventListener('pointerup',up);
    svg.addEventListener('pointercancel',up);
  });
}
function growRow(f,lb,val,min,max,st){
  val=val!=null?val:min;
  st=st||1;
  return '<div class="grow-row"><span class="lbl">'+lb+'</span><input type="range" data-gf="'+f+'" min="'+min+'" max="'+max+'" step="'+st+'" value="'+val+'"><input class="num" type="number" data-gf="'+f+'" min="'+min+'" max="'+max+'" step="'+st+'" value="'+val+'"></div>';
}
function renderPartsBar(){
  var host=grpHost(), box=$('bgGroupPartsBar');
  if(!host||!box)return;
  var g=host.g||[];
  box.innerHTML='';
  if(!g.length){ box.innerHTML='<div class="gpart-empty">Частей нет — добавьте ниже.</div>'; return; }
  g.forEach(function(p,i){
    var c=document.createElement('button');
    c.className='gchip'+(i===grpCtx.selPart?' active':'');
    c.title='Часть '+(i+1);
    c.innerHTML=(i+1)+'<span class="gchip-ic">'+esc(String(p.ch||'A').charAt(0)||'A')+'</span>';
    c.onclick=function(){
      grpCtx.selPart=i;
      renderPartsBar(); renderGroupPreview(); renderPartPanel();
    };
    box.appendChild(c);
  });
}
function renderPartPanel(){
  var host=grpHost(), box=$('bgGroupPanel');
  if(!host||!box)return;
  var g=host.g||[];
  var i=grpCtx.selPart;
  if(i==null||!g[i]){ box.innerHTML='<div class="gpart-empty">Нет выбранной части.</div>'; return; }
  var p=g[i];
  box.innerHTML='<div class="gpart-panel">'
    +'<div class="gpart-panel-head"><b>Часть '+(i+1)+' · Символ</b>'
    +'<span class="rr">'
    +'<button class="btn sm" data-gact="dup" title="Дублировать">'+I.dup+'</button>'
    +'<button class="btn sm" data-gact="del" title="Удалить">'+I.rm+'</button>'
    +'</span></div>'
    +'<label class="grow-row"><span class="lbl">Символы</span><input class="txt" data-gf="ch" maxlength="32" value="'+esc(p.ch||'A')+'" style="grid-column:2/4;justify-self:stretch"></label>'
    +growRow('fs','Размер',p.fs,6,100)
    +growRow('sx','Растяж. X',p.sx!=null?p.sx:1,0.2,3,0.05)
    +growRow('sy','Растяж. Y',p.sy!=null?p.sy:1,0.2,3,0.05)
    +growRow('x','X',p.x,0,100)
    +growRow('y','Y',p.y,0,100)
    +growRow('rot','Поворот',p.rot,-180,180)
    +'</div>';
  box.querySelectorAll('[data-gf]').forEach(function(inp){
    inp.addEventListener('input',function(){
      if(inp.dataset.gf==='ch'){ p.ch=inp.value; }
      else{ p[inp.dataset.gf]=parseFloat(inp.value)||0; }
      renderGroupPreview(); reqRender();
    });
  });
  box.querySelector('[data-gact="dup"]').onclick=function(){
    var c=JSON.parse(JSON.stringify(p));
    c.x=Math.min(100,(c.x||0)+4); c.y=Math.min(100,(c.y||0)+4);
    g.splice(i+1,0,c);
    grpCtx.selPart=i+1;
    renderPartsBar(); renderPartPanel(); renderGroupPreview(); reqRender();
  };
  box.querySelector('[data-gact="del"]').onclick=function(){
    g.splice(i,1);
    grpCtx.selPart=g.length?Math.max(0,Math.min(i,g.length-1)):null;
    renderPartsBar(); renderPartPanel(); renderGroupPreview(); reqRender();
  };
}
function closeGroupEditor(){ $('bgGroupOverlay').classList.add('hidden'); }
(function(){
  var ov=$('bgGroupOverlay');
  $('bgGroupClose').onclick=closeGroupEditor;
  $('bgGroupDone').onclick=closeGroupEditor;
  $('bgGroupAdd').onclick=function(){
    var host=grpHost(); if(!host)return;
    host.g=host.g||[];
    var c=defGroup()[0];
    c.x=Math.min(90,15+(host.g.length%5)*8);
    c.y=Math.min(90,15+Math.floor(host.g.length/5)*8);
    host.g.push(c);
    grpCtx.selPart=host.g.length-1;
    renderPartsBar(); renderPartPanel(); renderGroupPreview(); reqRender();
  };
  $('bgGroupDel').onclick=async function(){
    var Ly=state&&state.layers[sel];
    if(grpCtx.kind==='el'){
      if(!Ly||Ly.type!=='symbols'||!Ly.elems||!Ly.elems[grpCtx.ei])return;
      var ok=await Dialogs.confirm('Удалить элемент #'+(grpCtx.ei+1)+'?',{okText:'Удалить',danger:true});
      if(!ok)return;
      Ly.elems.splice(grpCtx.ei,1);
      closeGroupEditor();
      renderLook(); reqRender();
    }else{
      if(!Ly)return;
      var ok2=await Dialogs.confirm('Удалить слой '+(sel+1)+'?',{okText:'Удалить',danger:true});
      if(!ok2)return;
      state.layers.splice(sel,1);
      sel=state.layers.length?cl(sel,0,state.layers.length-1):'bg';
      closeGroupEditor();
      refresh();
    }
  };
  ov.addEventListener('mousedown',function(e){ if(e.target.id==='bgGroupOverlay')closeGroupEditor(); });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      var ov2=$('bgGroupOverlay');
      if(ov2&&!ov2.classList.contains('hidden'))closeGroupEditor();
      return;
    }
    var ov2=$('bgGroupOverlay');
    if(!ov2||ov2.classList.contains('hidden'))return;
    var tg=e.target;
    if(tg&&(tg.tagName==='INPUT'||tg.tagName==='TEXTAREA'||tg.tagName==='SELECT'))return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(e.key)===-1)return;
    var host=grpHost();
    if(!host)return;
    var g=host.g||[];
    var i=grpCtx.selPart;
    if(i==null||!g[i])return;
    e.preventDefault();
    var d=e.shiftKey?5:1;
    var p=g[i];
    if(e.key==='ArrowLeft')p.x=Math.max(0,Math.min(100,(p.x||0)-d));
    else if(e.key==='ArrowRight')p.x=Math.max(0,Math.min(100,(p.x||0)+d));
    else if(e.key==='ArrowUp')p.y=Math.max(0,Math.min(100,(p.y||0)-d));
    else if(e.key==='ArrowDown')p.y=Math.max(0,Math.min(100,(p.y||0)+d));
    renderGroupPreview(); renderPartPanel(); reqRender();
  });
})();

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
    c.innerHTML='<div class="prev"></div><div class="bar"><b>'+esc(b.name)+'</b><span class="actions"><button data-a="edit" title="Редактировать">'+I.edit+'</button><button data-a="del" title="Удалить">'+I.rm+'</button></span></div>';
    try{ show(c.querySelector('.prev'), b.state, 's'+b.id.replace(/[^a-zA-Z0-9]/g,'')); }catch(e){}
    c.querySelector('.prev').onclick=function(){ openSavedInEditor(b); };
    c.querySelector('[data-a="edit"]').onclick=function(e){
      e.stopPropagation();
      openSavedInEditor(b);
    };
    var del=c.querySelector('[data-a="del"]');
    del.onclick=async function(e){
      e.stopPropagation();
      if(await Dialogs.confirm('Удалить фон «'+b.name+'»?',{danger:true,okText:'Удалить'})){
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
  bgEditId=b.id;
  $('bghome').classList.add('hidden');
  $('bgedit').classList.remove('hidden');
  $('bgedTitle').textContent='Редактор — '+b.name;
  setSaveLabel();
  refresh();
}
$('bgsaveBtn').onclick=async function(){
  if(!state){ toast('Сначала создайте фон'); return; }
  if(bgEditId){
    if(!BackgroundsLib.get(bgEditId)){ bgEditId=null; setSaveLabel(); }
    else{
      BackgroundsLib.update(bgEditId, state);
      renderBGSaved();
      toast('Изменения сохранены ✓');
      return;
    }
  }
  var all=BackgroundsLib.getAll();
  var name=await Dialogs.prompt('Имя фона:', 'Фон '+(all.length+1));
  if(name&&name.trim()){
    var item=BackgroundsLib.save(JSON.parse(JSON.stringify(state)), name.trim());
    bgEditId=item.id;
    setSaveLabel();
    renderBGSaved();
    toast('Фон сохранён ✓');
  }
};

/* глобальные функции для AppController */
window.renderBGSaved = renderBGSaved;
window.openSavedInEditor = openSavedInEditor;

window.BGLAB_OK=1;
