/* =========================================================
   BG·LAB — ядро: утилиты, модель, генераторы, сборка SVG
   ========================================================= */

/* ---------- 0. Обработчик ошибок ---------- */
window.addEventListener('error', function(e){
  var el = document.getElementById('toast');
  if (el) {
    el.textContent = 'Ошибка: ' + e.message + ' (' + (e.lineno || '?') + ')';
    el.classList.add('show');
    setTimeout(function(){ el.classList.remove('show'); }, 8000);
  }
});

/* ---------- 1. Утилиты ---------- */
var W = 1600, H = 900;
function cl(v,a,b){ return Math.max(a, Math.min(b, v)); }
function $(id){ return document.getElementById(id); }
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* цвета */
function hexToRgb(x){x=x.replace('#','');if(x.length===3)x=x.split('').map(function(c){return c+c}).join('');var n=parseInt(x,16);return[n>>16&255,n>>8&255,n&255]}
function rgbToHex(r,g,b){return '#'+[r,g,b].map(function(v){return Math.round(cl(v,0,255)).toString(16).padStart(2,'0')}).join('')}
function rgbToHsv(r,g,b){r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0;if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360}return{h:h,s:mx?d/mx:0,v:mx}}
function hsvToRgb(h,s,v){var c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;var p=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return[(p[0]+m)*255,(p[1]+m)*255,(p[2]+m)*255]}
function hexToHsv(x){var p=hexToRgb(x);return rgbToHsv(p[0],p[1],p[2])}
function hsvToHex(h,s,v){var p=hsvToRgb(h,s,v);return rgbToHex(p[0],p[1],p[2])}
function sanHex(v){v=v.trim().replace(/^#/,'');if(/^[0-9a-f]{3}$/i.test(v))v=v.split('').map(function(c){return c+c}).join('');return/^[0-9a-f]{6}$/i.test(v)?'#'+v.toLowerCase():null}

/* иконки и имена */
var NAMES={grid:'Сетка',dots:'Точки',stripes:'Полосы',waves:'Волны',shapes:'Фигуры',symbols:'Символы',image:'Картинка',cursor:'Курсор-FX',scan:'Сканлайны',vignette:'Виньетка'};
var I={
  grid:'<svg class="ic" viewBox="0 0 16 16"><path d="M1 5.5h14M1 10.5h14M5.5 1v14M10.5 1v14" stroke="currentColor" fill="none"/></svg>',
  dots:'<svg class="ic" viewBox="0 0 16 16"><circle cx="4" cy="4" r="1.7" fill="currentColor"/><circle cx="12" cy="4" r="1.7" fill="currentColor"/><circle cx="4" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/></svg>',
  stripes:'<svg class="ic" viewBox="0 0 16 16"><path d="M-2 6L6 -2M2 14L14 2M8 18L18 8" stroke="currentColor" fill="none"/></svg>',
  waves:'<svg class="ic" viewBox="0 0 16 16"><path d="M1 5q3-3 6 0t6 0M1 11q3-3 6 0t6 0" stroke="currentColor" fill="none"/></svg>',
  shapes:'<svg class="ic" viewBox="0 0 16 16"><circle cx="5" cy="11" r="3" fill="currentColor"/><path d="M10 3l4 8H6z" fill="none" stroke="currentColor"/></svg>',
  symbols:'<svg class="ic" viewBox="0 0 16 16"><path d="M3 2h10M8 2v12" stroke="currentColor" stroke-width="1.6"/></svg>',
  image:'<svg class="ic" viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="none" stroke="currentColor"/><path d="M3 11l3.5-4 3 3.5L12 8l2.5 3" fill="none" stroke="currentColor"/></svg>',
  cursor:'<svg class="ic" viewBox="0 0 16 16"><path d="M4 2l9 5-4 1.5L7.5 13z" fill="currentColor"/></svg>',
  scan:'<svg class="ic" viewBox="0 0 16 16"><path d="M1 3h14M1 7h14M1 11h14M1 15h14" stroke="currentColor"/></svg>',
  vignette:'<svg class="ic" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".45"/><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor"/></svg>',
  eye:'<svg class="ic" viewBox="0 0 16 16"><path d="M1 8s3-4.5 7-4.5S15 8 15 8s-3 4.5-7 4.5S1 8 1 8z" fill="none" stroke="currentColor"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>',
  eyeoff:'<svg class="ic" viewBox="0 0 16 16"><path d="M2 2l12 12M1 8s3-4.5 7-4.5 7 4.5 7 4.5-3 4.5-7 4.5S1 8 1 8z" fill="none" stroke="currentColor"/></svg>',
  up:'<svg class="ic" viewBox="0 0 16 16"><path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  dn:'<svg class="ic" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  rm:'<svg class="ic" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2"/></svg>',
  bg:'<svg class="ic" viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="none" stroke="currentColor"/><path d="M1.5 11c3-2.5 5 2.5 8 0s3.5-3 5-3" stroke="currentColor" fill="none"/></svg>',
  mirror:'<svg class="ic" viewBox="0 0 16 16"><path d="M8 1v14M3 5l-2 3 2 3M13 5l2 3-2 3" stroke="currentColor" fill="none"/></svg>',
  dice:'<svg class="ic" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="3" fill="none" stroke="currentColor"/><circle cx="6" cy="6" r="1.2" fill="currentColor"/><circle cx="10" cy="10" r="1.2" fill="currentColor"/></svg>'
};

/* ---------- 2. Тёмный пикер цвета ---------- */
var popEl=null, popCur=null, popSet=null;
function commitPop(syncHex){
  var hex=hsvToHex(popCur.h,popCur.s,popCur.v);
  popSet(hex);
  popEl.querySelector('#pSw').style.background=hex;
  if(syncHex!==false)popEl.querySelector('#pHex').value=hex;
  var sv=popEl.querySelector('#pSv');
  sv.style.background='linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl('+popCur.h+',100%,50%))';
  sv.querySelector('.svdot').style.left=popCur.s*100+'%';
  sv.querySelector('.svdot').style.top=(1-popCur.v)*100+'%';
  popEl.querySelector('#pHue .huedot').style.left=popCur.h/360*100+'%';
}
function dragXY(el,cb){
  el.addEventListener('pointerdown',function(e){
    e.preventDefault();
    var mv=function(e2){var r=el.getBoundingClientRect();cb((e2.clientX-r.left)/r.width,(e2.clientY-r.top)/r.height)};
    var up=function(){removeEventListener('pointermove',mv);removeEventListener('pointerup',up)};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);
    mv(e);
  });
}
function openPicker(anchor,get,set){
  popSet=set;popCur=hexToHsv(get());
  if(!popEl){
    popEl=document.createElement('div');popEl.className='pop';
    popEl.innerHTML='<div class="sv" id="pSv"><div class="svdot"></div></div><div class="hue" id="pHue"><div class="huedot"></div></div><div class="cright"><input class="hex" id="pHex" spellcheck="false"><div class="csw" id="pSw"></div></div>';
    document.body.appendChild(popEl);
    dragXY(popEl.querySelector('#pSv'),function(x,y){popCur.s=cl(x,0,1);popCur.v=cl(1-y,0,1);commitPop()});
    dragXY(popEl.querySelector('#pHue'),function(x){popCur.h=cl(x,0,1)*360;commitPop()});
    popEl.querySelector('#pHex').addEventListener('input',function(e){var v=sanHex(e.target.value);if(v){popCur=hexToHsv(v);commitPop(false)}});
    document.addEventListener('pointerdown',function(e){
      if(popEl.style.display!=='none'&&!popEl.contains(e.target)&&!e.target.closest('.csw'))popEl.style.display='none';
    });
  }
  popEl.style.display='flex';
  var r=anchor.getBoundingClientRect();
  popEl.style.left=Math.min(r.right+10,innerWidth-245)+'px';
  popEl.style.top=Math.max(10,Math.min(r.top,innerHeight-280))+'px';
  commitPop();
}
/* зажал кубик и тянешь = меняешь оттенок; клик = открыть пикер */
function attachSwatch(el,get,set){
  el.addEventListener('pointerdown',function(e){
    e.preventDefault();
    var x0=e.clientX,h0=hexToHsv(get()),dr=false;
    var mv=function(e2){var dx=e2.clientX-x0;if(Math.abs(dx)>3)dr=true;if(dr){var h=((h0.h+dx*1.2)%360+360)%360;set(hsvToHex(h,h0.s,h0.v))}};
    var up=function(){removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(!dr)openPicker(el,get,set)};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);
  });
}
function bindColors(root,res,after){
  root.querySelectorAll('[data-ch]').forEach(function(inp){
    inp.addEventListener('input',function(){
      var v=sanHex(inp.value);if(!v)return;
      var k=inp.dataset.ch;res(k)[k]=v;
      var sw=root.querySelector('[data-cw="'+k+'"]');if(sw)sw.style.background=v;
      if(after)after(k);reqRender();
    });
  });
  root.querySelectorAll('[data-cw]').forEach(function(sw){
    var k=sw.dataset.cw;
    attachSwatch(sw,function(){return res(k)[k]},function(v){
      res(k)[k]=v;sw.style.background=v;
      var hx=root.querySelector('[data-ch="'+k+'"]');if(hx)hx.value=v;
      if(after)after(k);reqRender();
    });
  });
}

/* ---------- 3. Модель слоя ---------- */
function defCurve(){return[{t:0,v:100,lock:1},{t:50,v:35},{t:100,v:100,lock:1}]}
function newLayer(t){
  var b={
    type:t,visible:true,blend:'normal',
    neon:!['vignette','scan','image','cursor'].includes(t),
    color:'#ffffff',neonColor:'#ffffff',
    size:64,size2:64,sync:false,th:2,bend:0,op:90,blur:0,rot:0,x:0,y:0,
    moveDir:'none',moveSpeed:30,
    pulse:false,pulseDuration:1.2,pulseInterval:0,pulseCurve:defCurve(),
    mpulse:false,mpulseDuration:1.2,mpulseInterval:0,mpulseCurve:defCurve(),
    breath:false,breathDur:3,breathAmp:15,breathInterval:0,
    roll:'none',rollDur:6,
    spin:'none',spinDur:6,
    dist:0,distFreq:10,distAnim:false,distDuration:2,distInterval:0,distAmp:40,
    drift:false,driftColors:['#ffffff'],driftNeonColors:['#ffffff'],driftDur:6,
    elems:[{t:'0',w:50,s:26},{t:'1',w:50,s:26}],fs:26,random:true,count:90,colorMode:true,multi:true,seed:7,chaos:100,
    shape:'circle',outline:false,rotRand:0,sizeVar:40,
    fx:'drop',radius:150,strength:50,soft:30,exclude:[],gAmp:10,gSpeed:1,
    obj:'none',objSize:26,objSpin:true,
    src:null,scale:100,tileOn:false,tileSize:200,bright:100,contrast:100,satur:100,hueRot:0,gray:0,sepia:0,invert:0
  };
  if(t==='dots'){b.size=36;b.size2=36;b.th=3}
  if(t==='stripes'){b.size=28;b.th=3;b.rot=45}
  if(t==='waves'){b.size=70;b.size2=48;b.bend=16}
  if(t==='scan'){b.size=6;b.th=2;b.color='#000';b.op=30}
  if(t==='vignette'){b.color='#000';b.op=80}
  if(t==='symbols'){b.color='#3ef06b';b.neonColor='#1aff8c'}
  if(t==='shapes'){b.count=1;b.fs=60}
  if(t==='cursor'){b.color='#fff'}
  return b;
}
function L(t,o){return Object.assign(newLayer(t),o||{})}
function S(o){return Object.assign({
  bgBase:'#0a0a0a',
  bgs:[
    {on:true,color:'#ffffff',x:50,y:0,size:70,op:22},
    {on:false,color:'#888',x:0,y:100,size:60,op:18},
    {on:false,color:'#666',x:100,y:100,size:60,op:18},
    {on:false,color:'#aaa',x:50,y:50,size:50,op:15}
  ],
  layers:[]
},o)}

/* ---------- 4. Генераторы контента ---------- */
function chaosPos(Ly,rnd,k,c,r){
  var rx=rnd()*W,ry=rnd()*H;
  var gx=((k%c)+.5)*W/c,gy=(Math.floor(k/c)+.5)*H/r;
  var q=(Ly.chaos==null?100:Ly.chaos)/100;
  return[gx+(rx-gx)*q,gy+(ry-gy)*q];
}
function gridDims(n){var c=Math.max(1,Math.ceil(Math.sqrt(n*W/H)));return[c,Math.max(1,Math.ceil(n/c))]}
function elemSpin(Ly){
  if(!Ly||!Ly.spin||Ly.spin==='none')return '';
  if(Ly.spin==='swing')return '<animateTransform attributeName="transform" type="rotate" values="0;180;0" dur="'+((Ly.spinDur||6)*2).toFixed(2)+'s" repeatCount="indefinite"/>';
  return '<animateTransform attributeName="transform" type="rotate" values="0;360" dur="'+(Ly.spinDur||6)+'s" repeatCount="indefinite"/>';
}
function pickElemIdx(Ly,rnd){
  var E=Ly.elems&&Ly.elems.length?Ly.elems:[{t:'?',w:1}];
  var tot=0;E.forEach(function(e){tot+=Math.max(0,e.w)});
  if(tot<=0)return 0;
  var r=rnd()*tot;
  for(var k=0;k<E.length;k++){r-=Math.max(0,E[k].w);if(r<0)return k}
  return E.length-1;
}
function genSymbols(Ly,color,isGlow,g,gT,drift){
  var rnd=mulberry32(Ly.seed),t='',E=Ly.elems&&Ly.elems.length?Ly.elems:[{t:'?',w:1}],spin=elemSpin(Ly);
  function put(x,y,ch,sz){t+='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+')"><g>'+(spin||'')+'<text x="0" y="0" font-size="'+sz+'">'+esc(ch)+'</text></g></g>'}
  function esz(k){return Math.max(4,(E[k].s!=null?E[k].s:(Ly.fs||26))).toFixed(1)}
  if(Ly.random){
    var d=gridDims(Ly.count);
    for(var k=0;k<Ly.count;k++){
      var p=chaosPos(Ly,rnd,k,d[0],d[1]),gr=gT>1?(rnd()*gT)|0:0,k2=pickElemIdx(Ly,rnd);
      if(gr===g)put(p[0],p[1],E[k2].t,esz(k2));
    }
  }else{
    for(var y=Ly.size2/2;y<H+Ly.size2;y+=Ly.size2)
      for(var x=Ly.size/2;x<W+Ly.size/2;x+=Ly.size){
        var gr2=gT>1?(rnd()*gT)|0:0,k3=pickElemIdx(Ly,rnd);
        if(gr2===g)put(x,y,E[k3].t,esz(k3));
      }
  }
  var uf=Ly.colorMode||isGlow;
  var an=uf&&drift?'<animate attributeName="fill" values="'+drift.vs.join(';')+'" dur="'+drift.d+'s" repeatCount="indefinite"/>':'';
  return '<g font-family="monospace" font-size="'+(Ly.fs||26)+'" text-anchor="middle" '+(uf?'fill="'+color+'"':'')+'>'+an+t+'</g>';
}
function shapeGeom(t,s){
  if(t==='circle')return '<circle r="'+s+'"/>';
  if(t==='square')return '<rect x="'+(-s)+'" y="'+(-s)+'" width="'+(s*2)+'" height="'+(s*2)+'"/>';
  if(t==='tri')return '<polygon points="0,'+(-s)+' '+(s*.87).toFixed(1)+','+(s/2).toFixed(1)+' '+(-s*.87).toFixed(1)+','+(s/2).toFixed(1)+'"/>';
  if(t==='hex'){var p='';for(var k=0;k<6;k++){var a=Math.PI/3*k-Math.PI/2;p+=(Math.cos(a)*s).toFixed(1)+','+(Math.sin(a)*s).toFixed(1)+' '}return '<polygon points="'+p+'"/>'}
  var p2='';for(var k2=0;k2<10;k2++){var r=k2%2?s*.45:s,a2=Math.PI/5*k2-Math.PI/2;p2+=(Math.cos(a2)*r).toFixed(1)+','+(Math.sin(a2)*r).toFixed(1)+' '}
  return '<polygon points="'+p2+'"/>';
}
function genShapes(Ly,color,isGlow,g,gT,drift){
  var rnd=mulberry32(Ly.seed),t='',spin=elemSpin(Ly);
  function put(x,y,rot,s){t+='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+rot.toFixed(1)+')"><g>'+(spin||'')+shapeGeom(Ly.shape,s)+'</g></g>'}
  if(Ly.count<=1){
    put(W/2,H/2,(rnd()*2-1)*Ly.rotRand,Ly.fs); /* одна фигура — ровно по центру */
  }else{
    var d=gridDims(Ly.count);
    for(var k=0;k<Ly.count;k++){
      var x,y;
      if(Ly.random){var p=chaosPos(Ly,rnd,k,d[0],d[1]);x=p[0];y=p[1]}
      else{x=((k%d[0])+.5)*W/d[0];y=(Math.floor(k/d[0])+.5)*H/d[1]}
      var gr=gT>1?(rnd()*gT)|0:0;
      var rot=(rnd()*2-1)*Ly.rotRand;
      var s=Math.max(2,Ly.fs*(1+(rnd()*2-1)*(Ly.sizeVar||0)/100));
      if(gr===g)put(x,y,rot,s);
    }
  }
  var at=Ly.outline?'stroke="'+color+'" fill="none" stroke-width="'+Ly.th+'"':'fill="'+color+'" stroke="none"';
  var an=drift?'<animate attributeName="'+(Ly.outline?'stroke':'fill')+'" values="'+drift.vs.join(';')+'" dur="'+drift.d+'s" repeatCount="indefinite"/>':'';
  return '<g '+at+'>'+an+t+'</g>';
}
function imgContent(Ly){
  if(!Ly.src)return '<text x="'+(W/2)+'" y="'+(H/2)+'" fill="#555" font-size="36" text-anchor="middle" font-family="monospace">[ загрузи картинку ]</text>';
  var f='brightness('+Ly.bright+'%) contrast('+Ly.contrast+'%) saturate('+Ly.satur+'%) hue-rotate('+Ly.hueRot+'deg) grayscale('+Ly.gray+'%) sepia('+Ly.sepia+'%) invert('+Ly.invert+'%)';
  var spin=elemSpin(Ly);
  if(Ly.tileOn){
    var ts=Math.max(40,Ly.tileSize||200),t='';
    for(var y=0;y<H;y+=ts)
      for(var x=0;x<W;x+=ts)
        t+='<g transform="translate('+(x+ts/2)+' '+(y+ts/2)+')"><g>'+(spin||'')+'<image x="'+(-ts/2)+'" y="'+(-ts/2)+'" width="'+ts+'" height="'+ts+'" href="'+Ly.src+'" preserveAspectRatio="xMidYMid slice"/></g></g>';
    return '<g style="filter:'+f+'">'+t+'</g>';
  }
  var w=W*Ly.scale/100,h=H*Ly.scale/100;
  if(spin)return '<g transform="translate('+(W/2)+' '+(H/2)+')"><g>'+spin+'<image href="'+Ly.src+'" width="'+w+'" height="'+h+'" x="'+(-w/2)+'" y="'+(-h/2)+'" preserveAspectRatio="xMidYMid slice" style="filter:'+f+'"/></g></g>';
  return '<g style="filter:'+f+'"><image href="'+Ly.src+'" width="'+w+'" height="'+h+'" x="'+((W-w)/2)+'" y="'+((H-h)/2)+'" preserveAspectRatio="xMidYMid slice"/></g>';
}
function objGeom(Ly){
  var s=Ly.objSize,c=Ly.color;
  if(Ly.obj==='ring')return '<circle r="'+s+'" fill="none" stroke="'+c+'" stroke-width="2"/>';
  if(Ly.obj==='dot')return '<circle r="'+(s*.4)+'" fill="'+c+'"/>';
  if(Ly.obj==='hex'){var p='';for(var k=0;k<6;k++){var a=Math.PI/3*k;p+=(Math.cos(a)*s).toFixed(1)+','+(Math.sin(a)*s).toFixed(1)+' '}return '<polygon points="'+p+'" fill="none" stroke="'+c+'" stroke-width="2"/>'}
  var p2='';for(var k2=0;k2<10;k2++){var r=k2%2?s*.45:s,a2=Math.PI/5*k2-Math.PI/2;p2+=(Math.cos(a2)*r).toFixed(1)+','+(Math.sin(a2)*r).toFixed(1)+' '}
  return '<polygon points="'+p2+'" fill="'+c+'"/>';
}
/* паттерны: сетка / волны / точки / полосы / сканлайны / виньетка */
function layerContent(Ly,i,uid,color,drift,suf){
  var pid=uid+'p'+i+(suf||''),d='',b='';
  function an(a){return drift?'<animate attributeName="'+a+'" values="'+drift.vs.join(';')+'" dur="'+drift.d+'s" repeatCount="indefinite"/>':''}
  if(Ly.type==='grid'){
    var p='';
    for(var x=-400;x<=W+400;x+=Ly.size)p+='M'+x+' -300 Q '+(x+Ly.bend)+' '+(H/2)+' '+x+' '+(H+300)+' ';
    for(var y=-300;y<=H+300;y+=Ly.size2)p+='M-400 '+y+' Q '+(W/2)+' '+(y+Ly.bend)+' '+(W+400)+' '+y+' ';
    b='<path d="'+p+'" stroke="'+color+'" stroke-width="'+Ly.th+'" fill="none">'+an('stroke')+'</path>';
  }else if(Ly.type==='waves'){
    var p2='',wl=Math.max(20,Ly.size*2);
    for(var y2=-200;y2<=H+200;y2+=Ly.size2){p2+='M-400 '+y2+' ';for(var x2=-400;x2<=W+400;x2+=40)p2+='L'+x2+' '+(y2+Math.sin(x2/wl*Math.PI*2)*Ly.bend).toFixed(1)+' '}
    b='<path d="'+p2+'" stroke="'+color+'" stroke-width="'+Ly.th+'" fill="none" stroke-linejoin="round">'+an('stroke')+'</path>';
  }else if(Ly.type==='dots'){
    d='<pattern id="'+pid+'" width="'+Ly.size+'" height="'+Ly.size2+'" patternUnits="userSpaceOnUse"><circle cx="'+(Ly.size/2)+'" cy="'+(Ly.size2/2)+'" r="'+Ly.th+'" fill="'+color+'">'+an('fill')+'</circle></pattern>';
    b='<rect x="-400" y="-400" width="'+(W+800)+'" height="'+(H+800)+'" fill="url(#'+pid+')"/>';
  }else if(Ly.type==='stripes'){
    d='<pattern id="'+pid+'" width="'+Ly.size+'" height="'+Ly.size+'" patternUnits="userSpaceOnUse"><rect width="'+Ly.th+'" height="'+Ly.size+'" fill="'+color+'">'+an('fill')+'</rect></pattern>';
    b='<rect x="-400" y="-400" width="'+(W+800)+'" height="'+(H+800)+'" fill="url(#'+pid+')"/>';
  }else if(Ly.type==='scan'){
    d='<pattern id="'+pid+'" width="8" height="'+Ly.size+'" patternUnits="userSpaceOnUse"><rect width="8" height="'+Ly.th+'" fill="'+color+'">'+an('fill')+'</rect></pattern>';
    b='<rect x="-400" y="-400" width="'+(W+800)+'" height="'+(H+800)+'" fill="url(#'+pid+')"/>';
  }else if(Ly.type==='vignette'){
    d='<radialGradient id="'+pid+'" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="'+color+'" stop-opacity="0"/><stop offset="1" stop-color="'+color+'" stop-opacity=".85">'+an('stop-color')+'</stop></radialGradient>';
    b='<rect x="-400" y="-400" width="'+(W+800)+'" height="'+(H+800)+'" fill="url(#'+pid+')"/>';
  }
  return{d:d,b:b};
}
function mvFor(Ly){
  switch(Ly.type){
    case 'grid':case 'dots':return[Ly.size||64,Ly.size2||64];
    case 'stripes':return[Ly.size||28,Ly.size||28];
    case 'waves':return[Ly.size*2||140,Ly.size2||48];
    case 'scan':return[Ly.size*8||48,Ly.size||6];
    default:return[100,100];
  }
}
function pulseKF(uid,name,pts,dur,int){
  var cyc=dur+int,f=dur/cyc*100;
  var ks=pts.map(function(p){return (p.t*f/100).toFixed(2)+'%{opacity:'+(p.v/100).toFixed(2)+'}'}).join(' ');
  var last=(pts[pts.length-1].v/100).toFixed(2);
  return{
    css:'@keyframes '+name+'{'+ks+(f<99.9?' '+f.toFixed(2)+'%{opacity:'+last+'} 100%{opacity:'+last+'}':'')+'}',
    anim:name+' '+cyc.toFixed(2)+'s linear infinite'
  };
}

/* ---------- 5. Сборка SVG ---------- */
function buildSVG(st,uid){
  var defs='',css='',parts=[],sn=0;
  var bgR='<rect width="'+W+'" height="'+H+'" fill="'+st.bgBase+'"/>';

  /* фоновые градиенты */
  st.bgs.forEach(function(b,k){
    if(!b.on)return;
    defs+='<radialGradient id="'+uid+'bg'+k+'" cx="'+b.x+'%" cy="'+b.y+'%" r="'+Math.max(5,b.size)+'%"><stop offset="0" stop-color="'+b.color+'" stop-opacity="'+(b.op/100)+'"/><stop offset="1" stop-color="'+b.color+'" stop-opacity="0"/></radialGradient>';
    bgR+='<rect width="'+W+'" height="'+H+'" fill="url(#'+uid+'bg'+k+')"/>';
  });

  st.layers.forEach(function(Ly,i){
    if(!Ly.visible)return;

    /* ==== курсор-FX ==== */
    if(Ly.type==='cursor'){
      sn++;
      var sid=uid+'st'+sn,cid=uid+'c'+i,soft=Math.max(1,Ly.soft),ex=Ly.exclude||[];
      defs+='<filter id="'+cid+'b" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="'+soft+'"/></filter>'
        +'<mask id="'+cid+'m"><rect width="'+W+'" height="'+H+'" fill="#000"/><circle id="'+cid+'h" cx="'+(W/2)+'" cy="'+(H/2)+'" r="'+Ly.radius+'" fill="#fff" filter="url(#'+cid+'b)"/></mask>'
        +'<mask id="'+cid+'mi"><rect width="'+W+'" height="'+H+'" fill="#fff"/><circle id="'+cid+'hi" cx="'+(W/2)+'" cy="'+(H/2)+'" r="'+Ly.radius+'" fill="#000" filter="url(#'+cid+'b)"/></mask>';
      if(Ly.fx==='dissolve')defs+='<filter id="'+cid+'d" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="'+(40+Ly.strength)+'"/><feGaussianBlur stdDeviation="2"/></filter>';
      /* стек = слои ниже МИНУС исключения */
      defs+='<g id="'+sid+'">'+parts.filter(function(p){return !ex.includes(p.i)}).map(function(p){return p.s}).join('')+'</g>';
      if(Ly.fx==='dissolve')parts.forEach(function(p){if(!ex.includes(p.i))p.s='<g mask="url(#'+cid+'mi)">'+p.s+'</g>'});
      var cfg='data-cfg=\''+JSON.stringify({cid:cid,strength:Ly.strength,fx:Ly.fx})+'\'',body='';
      if(Ly.fx==='drop')body='<g '+cfg+' mask="url(#'+cid+'m)"><g id="'+cid+'t"><use href="#'+sid+'"/></g><circle id="'+cid+'ring" cx="'+(W/2)+'" cy="'+(H/2)+'" r="'+Ly.radius+'" fill="none" stroke="'+Ly.color+'" stroke-width="2"><animate attributeName="r" values="'+Math.round(Ly.radius*.2)+';'+Ly.radius+'" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="1.6s" repeatCount="indefinite"/></circle></g>';
      else if(Ly.fx==='dissolve')body='<g '+cfg+' mask="url(#'+cid+'m)"><use href="#'+sid+'" filter="url(#'+cid+'d)"/></g>';
      else if(Ly.fx==='glitch'){
        var a=Ly.gAmp,sp=Ly.gSpeed;
        body='<g '+cfg+' mask="url(#'+cid+'m)"><use href="#'+sid+'" opacity=".75" style="filter:saturate(4) hue-rotate(90deg)" transform="translate('+a+' 0)"><animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;'+(-a)+' '+(a/3)+';'+(a*.6)+' '+(-a/3)+';0 0" dur="'+(.38/sp).toFixed(2)+'s" repeatCount="indefinite"/></use><use href="#'+sid+'" opacity=".75" style="filter:saturate(4) hue-rotate(-120deg)" transform="translate('+(-a)+' 0)"><animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;'+a+' '+(-a/3)+';'+(-a*.6)+' '+(a/3)+';0 0" dur="'+(.31/sp).toFixed(2)+'s" repeatCount="indefinite"/></use></g>';
      }
      else if(Ly.fx==='flash')body='<g '+cfg+'><rect width="'+W+'" height="'+H+'" fill="#000" opacity="'+(Ly.strength/100).toFixed(2)+'" mask="url(#'+cid+'mi)"/></g>';
      else if(Ly.fx==='invert')body='<g '+cfg+' mask="url(#'+cid+'m)"><use href="#'+sid+'" style="filter:invert(1)"/></g>';
      if(Ly.obj!=='none')body+='<g id="'+cid+'o" transform="translate('+(W/2)+' '+(H/2)+')"><g>'+(Ly.objSpin?'<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite"/>':'')+'<animateTransform attributeName="transform" type="scale" additive="sum" values="1;1.25;1" dur="1.6s" repeatCount="indefinite"/>'+objGeom(Ly)+'</g></g>';
      parts.push({i:i,s:body});
      return;
    }

    /* ==== обычные слои ==== */
    var hd=Ly.dist>0||Ly.distAnim,fid=uid+'f'+i,gid=uid+'g'+i,did=uid+'d'+i;
    if(hd){
      var an='';
      if(Ly.distAnim){
        var cy=Ly.distDuration+Ly.distInterval,f=Math.min(Ly.distDuration/cy,.99);
        an='<animate attributeName="scale" values="'+Ly.dist+';'+(Ly.dist+Ly.distAmp)+';'+Ly.dist+';'+Ly.dist+'" keyTimes="0;'+(f/2).toFixed(3)+';'+f.toFixed(3)+';1" dur="'+cy.toFixed(2)+'s" repeatCount="indefinite"/>';
      }
      defs+='<filter id="'+did+'" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="'+(Ly.distFreq/1000).toFixed(4)+'" numOctaves="2" seed="'+(i+3)+'" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="'+Ly.dist+'">'+an+'</feDisplacementMap></filter>';
    }
    if(Ly.blur>0)defs+='<filter id="'+fid+'" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="'+Ly.blur+'"/></filter>';
    if(Ly.neon)defs+='<filter id="'+gid+'" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="'+Math.max(6,Ly.th*4)+'"/></filter>';

    var drift=Ly.drift&&Ly.driftColors.length?{vs:[Ly.color].concat(Ly.driftColors,[Ly.color]),d:Ly.driftDur}:null;
    var driftN=Ly.drift&&Ly.driftNeonColors.length?{vs:[Ly.neonColor].concat(Ly.driftNeonColors,[Ly.neonColor]),d:Ly.driftDur}:null;
    var gA='',mA='';
    if(Ly.neon&&Ly.pulse){var k1=pulseKF(uid,uid+'p'+i,Ly.pulseCurve,Ly.pulseDuration,Ly.pulseInterval);css+=k1.css;gA=k1.anim}
    if(Ly.mpulse){var k2=pulseKF(uid,uid+'q'+i,Ly.mpulseCurve,Ly.mpulseDuration,Ly.mpulseInterval);css+=k2.css;mA=k2.anim}

    var tile=Ly.type==='symbols'||Ly.type==='image'||Ly.type==='shapes';
    var inner='';
    if(tile){
      var gs=Ly.type==='symbols'&&Ly.multi&&Ly.moveDir!=='none'?3:1,gw='',mw='';
      for(var g=0;g<gs;g++){
        var mAn='',ux=0,uy=0;
        function tw(b,id){return mAn?'<g id="'+id+'">'+b+'</g><use href="#'+id+'" x="'+ux+'" y="'+uy+'"/>':b}
        if(Ly.moveDir!=='none'){
          var dx=0,dy=0;
          if(Ly.moveDir==='up')dy=-H;if(Ly.moveDir==='down')dy=H;
          if(Ly.moveDir==='left')dx=-W;if(Ly.moveDir==='right')dx=W;
          var du=(300/Ly.moveSpeed)/(1+g*.6),nm=uid+'m'+i+'_'+g;
          css+='@keyframes '+nm+'{to{transform:translate('+dx+'px,'+dy+'px)}}';
          mAn='animation:'+nm+' '+du.toFixed(2)+'s linear infinite';
          ux=-dx;uy=-dy;
        }
        function bf(c,ig,dr){return Ly.type==='image'?imgContent(Ly):(Ly.type==='shapes'?genShapes(Ly,c,ig,g,gs,dr):genSymbols(Ly,c,ig,g,gs,dr))}
        mw+='<g '+(mAn?'style="'+mAn+'"':'')+'>'+tw(bf(Ly.color,false,drift),uid+'s'+i+'_'+g)+'</g>';
        if(Ly.neon)gw+='<g '+(mAn?'style="'+mAn+'"':'')+'>'+tw(bf(Ly.neonColor,true,driftN),uid+'sg'+i+'_'+g)+'</g>';
      }
      inner=(Ly.neon?'<g '+(gA?'style="animation:'+gA+'"':'')+' filter="url(#'+gid+')">'+gw+'</g>':'')
        +'<g '+(mA?'style="animation:'+mA+'"':'')+' '+(Ly.blur>0?'filter="url(#'+fid+')"':'')+'>'+mw+'</g>';
    }else{
      var main=layerContent(Ly,i,uid,Ly.color,drift);
      var glow=Ly.neon?layerContent(Ly,i,uid,Ly.neonColor,driftN,'g'):null;
      var ans=[];
      if(Ly.moveDir!=='none'){
        var pp=mvFor(Ly),dx2=0,dy2=0;
        if(Ly.moveDir==='up')dy2=-pp[1];if(Ly.moveDir==='down')dy2=pp[1];
        if(Ly.moveDir==='left')dx2=-pp[0];if(Ly.moveDir==='right')dx2=pp[0];
        css+='@keyframes '+uid+'m'+i+'{to{transform:translate('+dx2+'px,'+dy2+'px)}}';
        ans.push(uid+'m'+i+' '+(60/Ly.moveSpeed).toFixed(2)+'s linear infinite');
      }
      inner='<g '+(ans.length?'style="animation:'+ans.join(',')+'"':'')+'>'
        +(glow?'<g '+(gA?'style="animation:'+gA+'"':'')+' filter="url(#'+gid+')">'+glow.d+glow.b+'</g>':'')
        +'<g '+(mA?'style="animation:'+mA+'"':'')+' '+(Ly.blur>0?'filter="url(#'+fid+')"':'')+'>'+main.d+main.b+'</g></g>';
    }

    /* ролл и дыхание */
    if(Ly.roll!=='none'){
      var ra;
      if(Ly.roll==='spin'){css+='@keyframes '+uid+'r'+i+'{to{transform:rotate(360deg)}}';ra=uid+'r'+i+' '+Ly.rollDur+'s linear infinite'}
      else{css+='@keyframes '+uid+'r'+i+'{0%{transform:rotate(0)}50%{transform:rotate(360deg)}100%{transform:rotate(0)}}';ra=uid+'r'+i+' '+(Ly.rollDur*2).toFixed(2)+'s ease-in-out infinite'}
      inner='<g style="transform-origin:800px 450px;animation:'+ra+'">'+inner+'</g>';
    }
    if(Ly.breath){
      var cy2=Ly.breathDur+Ly.breathInterval,f2=Ly.breathDur/cy2*100,sc=(1+Ly.breathAmp/100).toFixed(3);
      css+='@keyframes '+uid+'b'+i+'{0%{transform:scale(1)} '+(f2/2).toFixed(1)+'%{transform:scale('+sc+')} '+f2.toFixed(1)+'%{transform:scale(1)} 100%{transform:scale(1)}}';
      inner='<g style="transform-origin:800px 450px;animation:'+uid+'b'+i+' '+cy2.toFixed(2)+'s linear infinite">'+inner+'</g>';
    }

    parts.push({i:i,s:'<g opacity="'+(Ly.op/100)+'" style="mix-blend-mode:'+Ly.blend+'" transform="translate('+Ly.x+' '+Ly.y+') rotate('+Ly.rot+' '+(W/2)+' '+(H/2)+')"><g '+(hd?'filter="url(#'+did+')"':'')+'>'+inner+'</g></g>'});
  });

  return '<defs>'+defs+'</defs>'+bgR+'<g>'+parts.map(function(p){return p.s}).join('')+'</g>'+(css?'<style>'+css+'</style>':'');
}
function show(el,st,uid){el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice">'+buildSVG(st,uid)+'</svg>'}

/* ---------- 6. Курсор-FX: привязка к мыши ---------- */
function bindCursorFX(root){
  var svg=root.querySelector('svg');if(!svg)return;
  if(root._cm)root.removeEventListener('pointermove',root._cm);
  var nd=[].slice.call(svg.querySelectorAll('[data-cfg]')).map(function(g){
    var c=JSON.parse(g.getAttribute('data-cfg'));
    return{c:c,h:svg.querySelector('#'+c.cid+'h'),hi:svg.querySelector('#'+c.cid+'hi'),ring:svg.querySelector('#'+c.cid+'ring'),t:svg.querySelector('#'+c.cid+'t'),o:svg.querySelector('#'+c.cid+'o')};
  });
  if(!nd.length)return;
  var mv=function(e){
    var m=svg.getScreenCTM();if(!m)return;
    var pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
    var p=pt.matrixTransform(m.inverse());
    nd.forEach(function(n){
      if(n.h){n.h.setAttribute('cx',p.x);n.h.setAttribute('cy',p.y)}
      if(n.hi){n.hi.setAttribute('cx',p.x);n.hi.setAttribute('cy',p.y)}
      if(n.ring){n.ring.setAttribute('cx',p.x);n.ring.setAttribute('cy',p.y)}
      if(n.t){var k=1+n.c.strength/100;n.t.setAttribute('transform','translate('+p.x+' '+p.y+') scale('+k+') translate('+(-p.x)+' '+(-p.y)+')')}
      if(n.o)n.o.setAttribute('transform','translate('+p.x+' '+p.y+')');
    });
  };
  root._cm=mv;
  root.addEventListener('pointermove',mv);
}

/* ---------- 7. Пресеты ---------- */
var PRESETS=[
  {name:'Неон-сетка',st:function(){return S({layers:[L('grid',{}),L('vignette',{})]})}},
  {name:'Одна фигура',st:function(){return S({layers:[L('shapes',{shape:'hex',outline:true,th:3,count:1,fs:180,roll:'spin',rollDur:12,breath:true,breathAmp:12}),L('grid',{size:96,size2:96,op:30}),L('vignette',{})]})}},
  {name:'Капля',st:function(){return S({layers:[L('grid',{size:48,size2:48}),L('cursor',{fx:'drop',radius:170,strength:70,obj:'ring'}),L('vignette',{})]})}},
  {name:'Глитч-зона',st:function(){return S({layers:[L('dots',{color:'#ff8ae2',neonColor:'#ff3ec8'}),L('cursor',{fx:'glitch',radius:200,gAmp:14,gSpeed:1.4}),L('vignette',{})]})}},
  {name:'Геометрия',st:function(){return S({layers:[L('shapes',{shape:'hex',outline:true,count:40,fs:38,rotRand:30,sizeVar:60,breath:true,breathAmp:22,roll:'spin',rollDur:16}),L('vignette',{})]})}},
  {name:'Звездопад',st:function(){return S({layers:[L('shapes',{shape:'star',count:80,fs:12,sizeVar:80,moveDir:'down',moveSpeed:25,color:'#fff',neonColor:'#ffd166'}),L('vignette',{})]})}},
  {name:'Матрица',st:function(){return S({layers:[L('symbols',{color:'#3ef06b',neonColor:'#1aff8c',count:120,fs:24,moveDir:'down',moveSpeed:40,multi:true}),L('scan',{}),L('vignette',{})]})}},
  {name:'Перетекание',st:function(){return S({layers:[L('grid',{pulse:true,mpulse:true,pulseDuration:2,mpulseDuration:2,pulseCurve:[{t:0,v:0,lock:1},{t:55,v:15},{t:100,v:100,lock:1}],mpulseCurve:[{t:0,v:100,lock:1},{t:55,v:85},{t:100,v:0,lock:1}]}),L('vignette',{})]})}},
  {name:'Синтвейв',st:function(){return S({bgs:[{on:true,color:'#2a0a4a',x:50,y:0,size:80,op:60},{on:false},{on:false},{on:false}],layers:[L('grid',{color:'#ff4ecd',neonColor:'#8a5cff',size:72,size2:72,moveDir:'up',moveSpeed:25}),L('scan',{}),L('vignette',{})]})}},
  {name:'Иероглифы',st:function(){return S({layers:[L('symbols',{elems:'アイウエオカキクケコ'.split('').map(function(c){return{t:c,w:10}}),color:'#ff4ecd',neonColor:'#ff2e9a',random:false,size:90,size2:90,fs:34,drift:true,driftColors:['#ff4ecd','#00ffc8'],driftNeonColors:['#ff2e9a','#8a5cff']}),L('vignette',{})]})}},
  {name:'Океан',st:function(){return S({bgs:[{on:true,color:'#062b33',x:50,y:100,size:90,op:70},{on:false},{on:false},{on:false}],layers:[L('waves',{color:'#3ef0c0',neonColor:'#19b9ff',moveDir:'left',moveSpeed:20}),L('vignette',{})]})}},
  {name:'Хамелеон',st:function(){return S({layers:[L('grid',{size:44,size2:44,drift:true,driftColors:['#00ffc8','#ffd166','#ff4ecd'],driftNeonColors:['#b06bff','#22d3ee','#ff4ecd'],driftDur:9}),L('vignette',{})]})}}
];