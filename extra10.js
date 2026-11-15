/* Arcane Reads v2.2 — fluidez, menú flotante, mini reproductor de lectura y libro 3D suave */
(function(){
const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const OUT='cubic-bezier(.22,1,.36,1)', INOUT='cubic-bezier(.65,0,.35,1)';
const buzz=n=>{try{navigator.vibrate&&navigator.vibrate(n)}catch(e){}};

/* ───────────────────────────────────────────────────────────
   1) RENDIMIENTO · imágenes base64 → blobs en caché
   Las portadas/fotos guardadas como base64 se re-incrustaban completas en el HTML en cada
   render (megas de texto que había que volver a leer y decodificar). Ahora el HTML lleva
   una URL corta; los datos guardados NO cambian.
   ─────────────────────────────────────────────────────────── */
const RE=/data:image\/(?:jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+\/=]+/g;
const blobs=new Map();
const fp=u=>{const n=u.length,m=n>>1;return n+':'+u.slice(60,100)+u.slice(m,m+40)+u.slice(-48)};
function toBlob(u){
  const k=fp(u);let b=blobs.get(k);if(b)return b;
  try{
    const i=u.indexOf(','),mime=u.slice(5,u.indexOf(';')),bin=atob(u.slice(i+1)),a=new Uint8Array(bin.length);
    for(let j=0;j<bin.length;j++)a[j]=bin.charCodeAt(j);
    b=URL.createObjectURL(new Blob([a],{type:mime}));blobs.set(k,b);return b;
  }catch(e){return u}
}
const lite=v=>(typeof v==='string'&&v.indexOf('data:image')>-1)?v.replace(RE,toBlob):v;
(function(){
  const ih=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  if(ih&&ih.set)Object.defineProperty(Element.prototype,'innerHTML',{configurable:true,enumerable:ih.enumerable,get:ih.get,set(v){ih.set.call(this,lite(v))}});
  const ia=Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML=function(p,h){return ia.call(this,p,lite(h))};
  const sp=CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty=function(n,v,pr){return sp.call(this,n,lite(v),pr)};
})();

/* guardado agrupado: antes cada pulsación copiaba TODA la biblioteca a IndexedDB */
const _save=save;let _t=0,_w=[];
function flush(){
  clearTimeout(_t);_t=0;const w=_w;_w=[];if(!w.length)return Promise.resolve();
  const done=()=>w.forEach(r=>r());return _save().then(done,done);
}
save=function(){return new Promise(r=>{_w.push(r);clearTimeout(_t);_t=setTimeout(flush,350)})};
addEventListener('pagehide',flush);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});

/* ───────────────────────────────────────────────────────────
   2) Transición suave entre pestañas
   ─────────────────────────────────────────────────────────── */
setTab=function(n){
  const same=n===tab;tab=n;render();
  if(same)return;
  scrollTo(0,0);
  const m=$('main');
  if(m&&!reduce())m.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:380,easing:OUT});
};

/* ───────────────────────────────────────────────────────────
   3) Menú inferior flotante con indicador deslizante
   ─────────────────────────────────────────────────────────── */
const NAV=['Inicio','Libros','Biblioteca','Estadísticas','Perfil'];
const NAV_ICON={'Inicio':'<path d="M3 10 12 3l9 7v10H3z"/><path d="M9 20v-7h6v7"/>','Libros':'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>','Biblioteca':'<path d="M3 5h6l3 2 3-2h6v15h-6l-3 2-3-2H3zM12 7v15"/>','Estadísticas':'<path d="M4 20V12h4v8M10 20V4h4v16M16 20v-11h4v11"/>','Perfil':'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'};
renderNav=function(){
  const nav=$('nav');if(!nav)return;
  if(!nav.dataset.built){
    nav.innerHTML='<i class="nav-ind" aria-hidden="true"></i>'+NAV.map(n=>`<button data-t="${n}" onclick="setTab('${n}')"><svg viewBox="0 0 24 24" aria-hidden="true">${NAV_ICON[n]}</svg><span>${n}</span></button>`).join('');
    nav.dataset.built='1';
  }
  nav.style.setProperty('--i',Math.max(0,NAV.indexOf(tab)));
  nav.querySelectorAll('button').forEach(b=>{const on=b.dataset.t===tab;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false')});
};

/* ───────────────────────────────────────────────────────────
   4) Sesión de lectura en vivo + mini reproductor
   data.live = {bookId, acc (seg acumulados), since (ms, 0 si está en pausa), finishing}
   ─────────────────────────────────────────────────────────── */
const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 5.4v13.2a1 1 0 0 0 1.52.85l10.5-6.6a1 1 0 0 0 0-1.7L9.72 4.55A1 1 0 0 0 8.2 5.4z" fill="currentColor"/></svg>';
const PAUSE='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.3" y="4.8" width="4.1" height="14.4" rx="1.5" fill="currentColor"/><rect x="13.6" y="4.8" width="4.1" height="14.4" rx="1.5" fill="currentColor"/></svg>';
const UP='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14.5 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const elapsed=l=>l?(l.acc||0)+(l.since?Math.max(0,Math.floor((Date.now()-l.since)/1000)):0):0;
const clock=s=>{const h=s/3600|0,m=(s%3600)/60|0,x=s%60,p=v=>String(v).padStart(2,'0');return h?`${h}:${p(m)}:${p(x)}`:`${p(m)}:${p(x)}`};
function currentBook(){const l=data.live;if(l){const b=getBook(l.bookId);if(b)return b}return readingBooks()[0]||null}
const isRunning=()=>!!(data.live&&data.live.since);

const mini=document.createElement('div');
mini.id='mini';mini.className='mplay';
mini.innerHTML=`<button class="mp-open" type="button" aria-label="Abrir sesión de lectura"><span class="mp-cov"></span><span class="mp-txt"><b class="mp-title"></b><span class="mp-sub"><i class="mp-dot"></i><em class="mp-state"></em></span></span></button><span class="mp-time">00:00</span><button class="mp-play" type="button" aria-label="Reproducir">${PLAY}</button><button class="mp-up" type="button" aria-label="Expandir">${UP}</button><i class="mp-prog"><b></b></i>`;
document.body.appendChild(mini);
const q=s=>mini.querySelector(s);
q('.mp-play').onclick=e=>{e.stopPropagation();liveToggle()};
q('.mp-open').onclick=()=>openLive();
q('.mp-up').onclick=()=>openLive();

let iv=0;
function tick(){
  const s=elapsed(data.live);
  q('.mp-time').textContent=clock(s);
  const t=$('lsTime');if(t)t.textContent=clock(s);
}
function syncTick(){
  const run=isRunning();
  if(run&&!iv)iv=setInterval(tick,1000);
  if(!run&&iv){clearInterval(iv);iv=0}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});

function updateMini(){
  const b=currentBook(),l=data.live,run=isRunning(),s=elapsed(l);
  document.body.classList.toggle('has-mini',!!b);
  mini.classList.toggle('show',!!b);
  if(!b){syncTick();return}
  const ck=b.id+'|'+(b.cover||'').length;
  if(mini.dataset.ck!==ck){mini.dataset.ck=ck;q('.mp-cov').innerHTML=b.cover?`<img src="${esc(b.cover)}" alt="">`:'<span>📖</span>'}
  q('.mp-title').textContent=b.title||'Libro';
  q('.mp-state').textContent=run?'Leyendo':(s>0?'En pausa':'Listo para leer');
  mini.dataset.state=run?'play':'pause';
  q('.mp-time').textContent=clock(s);
  const pb=q('.mp-play');
  if(pb.dataset.i!==(run?'p':'a')){pb.dataset.i=run?'p':'a';pb.innerHTML=run?PAUSE:PLAY}
  pb.setAttribute('aria-label',run?'Pausar lectura':(s>0?'Continuar lectura':'Empezar lectura'));
  q('.mp-prog b').style.width=(b.pages?pct(b):0)+'%';
  syncTick();
}
function pulseMini(){mini.classList.remove('pulse');void mini.offsetWidth;mini.classList.add('pulse')}

function liveToggle(id){
  const b=getBook(id)||currentBook();if(!b)return;
  let l=data.live,changed=false;
  if(!l||l.bookId!==b.id)l=data.live={bookId:b.id,acc:0,since:0,finishing:false};
  if(l.since){l.acc=elapsed(l);l.since=0}
  else{l.since=Date.now();l.finishing=false;if(b.status!=='Leyendo'){b.status='Leyendo';changed=true}}
  save();updateMini();refreshLiveSheet();buzz(10);
  if(changed)setTimeout(()=>{if(!$('dlg').open)render()},300);
}
function liveStart(id){
  const b=getBook(id);if(!b)return;
  const l=data.live;
  if(l&&l.bookId!==id){
    const other=getBook(l.bookId);
    if(elapsed(l)>=30&&!confirm(`Tienes una sesión en curso de “${other?other.title:'otro libro'}”. ¿Descartarla y empezar esta?`))return false;
    data.live=null;
  }
  if(!data.live||data.live.bookId!==id)data.live={bookId:id,acc:0,since:0,finishing:false};
  if(!data.live.since){data.live.since=Date.now();data.live.finishing=false}
  const changed=b.status!=='Leyendo';if(changed)b.status='Leyendo';
  save();updateMini();buzz(12);
  if(changed)setTimeout(()=>{if(!$('dlg').open)render()},500);
  return true;
}
const closeAny=()=>{const d=$('dlg');if(d.open&&d.dataset.view==='1')closeViewer();else closeSheet()};
startSession=function(id){
  if(liveStart(id)===false)return;
  closeAny();
  setTimeout(()=>{pulseMini();toast('Sesión iniciada · pausa o termina desde el reproductor')},reduce()?0:480);
};
function openLive(){const b=currentBook();if(b)openReadingSession(b.id)}

/* hoja expandida de la sesión */
function refreshLiveSheet(){
  const pb=$('lsPlay');if(!pb)return;
  const run=isRunning(),s=elapsed(data.live);
  pb.innerHTML=run?PAUSE:PLAY;pb.setAttribute('aria-label',run?'Pausar':'Continuar');
  const st=$('lsState');if(st){st.textContent=run?'Leyendo ahora':(s>0?'En pausa':'Listo para empezar');st.dataset.on=run?'1':''}
  const t=$('lsTime');if(t)t.textContent=clock(s);
  const f=$('lsFinish');if(f)f.disabled=s<1;
}
openReadingSession=function(id){
  const l=data.live,b=(l&&getBook(l.bookId)&&(l.since||elapsed(l)>0))?getBook(l.bookId):(getBook(id)||currentBook());
  if(!b)return;
  showSheet(`<div class="sheet-header"><div><h2>Sesión de lectura</h2><div class="muted small">${esc(b.author||'')}</div></div><button class="sheet-close" onclick="closeSheet()" aria-label="Cerrar">×</button></div>
  <div class="ls"><div class="ls-cov">${coverHtml(b)}</div><h3 class="ls-title">${esc(b.title)}</h3>
  <div class="ls-time" id="lsTime">00:00</div><div class="ls-state" id="lsState"></div>
  <button class="ls-play" id="lsPlay" type="button"></button>
  <div class="ls-row"><button class="btn-soft" id="lsFinish" type="button">Terminar y guardar</button><button class="mini-btn" id="lsDiscard" type="button">Descartar</button></div></div>`);
  $('lsPlay').onclick=()=>liveToggle(b.id);
  $('lsFinish').onclick=()=>{
    const s=elapsed(data.live);if(!data.live||s<1)return;
    data.live.acc=s;data.live.since=0;data.live.finishing=true;save();updateMini();
    closeSheet();sessionDialog();
    setTimeout(()=>{if($('sessBook'))$('sessBook').value=b.id;if($('sessMins'))$('sessMins').value=Math.max(1,Math.round(s/60))},60);
  };
  $('lsDiscard').onclick=()=>{
    if(elapsed(data.live)>=60&&!confirm('¿Descartar el tiempo de esta sesión?'))return;
    data.live=null;save();updateMini();closeSheet();toast('Sesión descartada');
  };
  refreshLiveSheet();
};
const _saveSession=saveSession;
saveSession=function(){const fin=data.live&&data.live.finishing;_saveSession();if(fin){data.live=null;save();updateMini()}};

const _render=render;
render=function(){_render();updateMini()};

/* ───────────────────────────────────────────────────────────
   5) Libro 3D: se levanta de la repisa, vuela al centro y gira; al cerrar vuelve
   ─────────────────────────────────────────────────────────── */
let keep=false,closing=false,tapInfo=null,originEl=null,originId=null;
const shelfEl=id=>[...document.querySelectorAll('.shelf-book')].find(e=>e.dataset.id===id)||null;
function hideOrigin(el,id){restoreOrigin();originEl=el||null;originId=id||null;if(el)el.style.visibility='hidden'}
function restoreOrigin(){
  document.querySelectorAll('.shelf-book').forEach(e=>{if(e.style.visibility==='hidden')e.style.visibility=''});
  originEl=null;originId=null;
}
/* id del libro en cada botón de la repisa */
const _sbh=shelfBookHtml;
shelfBookHtml=function(b){return _sbh(b).replace('<button ',`<button data-id="${esc(b.id)}" `)};
document.addEventListener('click',e=>{
  const el=e.target.closest&&e.target.closest('.shelf-book');if(!el)return;
  const id=el.dataset.id||((el.getAttribute('onclick')||'').match(/openBook\('([^']+)'/)||[])[1];
  tapInfo={id,el,rect:el.getBoundingClientRect(),t:Date.now()};
},true);

const startAngle=b=>b.display==='Portada'?0:b.display==='Canto'?-90:90;
const ready=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

const _showSheet=showSheet;
showSheet=function(h){
  const d=$('dlg');
  if(!keep){d.removeAttribute('data-view');restoreOrigin();closing=false}
  _showSheet(h);
};
const closeNow=closeSheet;
closeSheet=function(){const d=$('dlg');restoreOrigin();d.removeAttribute('data-view');closing=false;closeNow()};

const _openBook=openBook;
openBook=function(id){
  const d=$('dlg');
  const tap=tapInfo&&tapInfo.id===id&&Date.now()-tapInfo.t<800?tapInfo:null;tapInfo=null;
  d.dataset.view='1';keep=true;
  try{_openBook(id)}finally{keep=false}
  const b=getBook(id),c=$('cube'),st=d.querySelector('.edstage'),vw=d.querySelector('.vw');
  if(!b||!c||!st||!vw){d.removeAttribute('data-view');return}
  closing=false;
  d.querySelectorAll('.vx').forEach(x=>x.setAttribute('onclick','closeViewer()'));
  vw.insertAdjacentHTML('afterbegin','<div class="vw-bg"></div>');
  st.insertAdjacentHTML('afterbegin','<div class="vw-floor"></div>');
  const el=tap&&tap.el&&tap.el.isConnected?tap.el:shelfEl(id);
  hideOrigin(el,id);
  if(!tap||!el||reduce()){window.__flightUntil=0;return}
  fly(b,c,st,vw,d,tap.rect);
};

function fly(b,c,st,vw,d,r){
  const DUR=860;
  const tr=c.getBoundingClientRect(),sr=st.getBoundingClientRect();
  if(!tr.height||!tr.width)return;
  const cx=tr.left+tr.width/2,cy=tr.top+tr.height/2;
  const s=Math.max(.12,Math.min(1.2,r.height/tr.height));
  const dx=r.left+r.width/2-cx,dy=r.top+r.height/2-cy;
  const lift=Math.min(54,Math.max(26,r.height*.3));
  st.style.transformOrigin=`${cx-sr.left}px ${cy-sr.top}px`;
  const fl=vw.querySelector('.vw-floor')||st.querySelector('.vw-floor');
  if(fl){fl.style.setProperty('--y',(tr.height/2+4)+'px');fl.style.setProperty('--fw',(tr.width*1.05)+'px')}
  window.__flightUntil=Date.now()+DUR*.7;

  /* el libro gira desde la orientación en que estaba en la repisa hasta la vista 3D */
  if(b.display!=='Apilado'){
    c.style.transition='none';cubeAngle=startAngle(b);drawCube();void c.offsetWidth;
    c.style.transition=`transform ${DUR}ms ${OUT}`;cubeAngle=-20;drawCube();
    setTimeout(()=>{if(c.isConnected)c.style.transition=''},DUR+120);
  }
  st.style.willChange='transform';
  const T=(x,y,k)=>`translate(${x}px,${y}px) scale(${k})`;
  const a=st.animate([
    {transform:T(dx,dy,s),offset:0,easing:'cubic-bezier(.3,.7,.35,1)'},
    {transform:T(dx*.9,dy*.9-lift,s*1.1+(1-s)*.04),offset:.2,easing:OUT},
    {transform:T(0,0,1),offset:1}
  ],{duration:DUR,fill:'backwards'});
  a.finished.then(()=>{st.style.willChange=''}).catch(()=>{});
  const bg=vw.querySelector('.vw-bg');
  if(bg)bg.animate([{opacity:0},{opacity:1}],{duration:DUR*.75,easing:'cubic-bezier(.3,0,.2,1)',fill:'backwards'});
  if(fl)fl.animate([{opacity:0},{opacity:0,offset:.4},{opacity:1}],{duration:DUR,easing:'ease-out',fill:'backwards'});
  [['.vx',0],['.vt',.3],['.vbar',.4]].forEach(([sel,k])=>{
    const n=d.querySelector(sel);
    if(n)n.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:520,delay:DUR*k,easing:OUT,fill:'backwards'});
  });
}

/* cerrar: el libro regresa volando a su lugar en la repisa */
window.closeViewer=function(){
  const d=$('dlg');
  if(!d.open||d.dataset.view!=='1')return closeSheet();
  if(closing)return;
  const b=draft&&getBook(draft.id)||getBook(originId),c=$('cube'),st=d.querySelector('.edstage'),vw=d.querySelector('.vw');
  const el=(originEl&&originEl.isConnected?originEl:null)||(originId?shelfEl(originId):null);
  const r=el?el.getBoundingClientRect():null;
  const on=r&&r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
  if(!b||!c||!st||!vw||!on||reduce()){
    if(vw&&!reduce()){closing=true;vw.animate([{opacity:1},{opacity:0}],{duration:200,easing:'ease-out',fill:'forwards'}).finished.then(()=>closeSheet(),()=>closeSheet())}
    else closeSheet();
    return;
  }
  closing=true;
  const DUR=620;
  st.getAnimations().forEach(x=>x.cancel());
  const tr=c.getBoundingClientRect(),sr=st.getBoundingClientRect();
  const cx=tr.left+tr.width/2,cy=tr.top+tr.height/2;
  const s=Math.max(.12,Math.min(1.2,r.height/tr.height));
  const dx=r.left+r.width/2-cx,dy=r.top+r.height/2-cy;
  const lift=Math.min(40,Math.max(18,r.height*.22));
  st.style.transformOrigin=`${cx-sr.left}px ${cy-sr.top}px`;st.style.willChange='transform,opacity';
  if(b.display!=='Apilado'){c.style.transition=`transform ${DUR}ms ${INOUT}`;cubeAngle=startAngle(b);drawCube()}
  d.querySelectorAll('.vt,.vbar,.vx').forEach(n=>n.animate([{opacity:1},{opacity:0}],{duration:200,easing:'ease-out',fill:'forwards'}));
  const fl=st.querySelector('.vw-floor');if(fl)fl.animate([{opacity:1},{opacity:0}],{duration:DUR*.5,easing:'ease-in',fill:'forwards'});
  const bg=vw.querySelector('.vw-bg');if(bg)bg.animate([{opacity:1},{opacity:0}],{duration:DUR*.9,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
  const T=(x,y,k)=>`translate(${x}px,${y}px) scale(${k})`;
  const a=st.animate([
    {transform:T(0,0,1),opacity:1,offset:0,easing:'cubic-bezier(.5,0,.3,1)'},
    {transform:T(dx,dy-lift*.35,s*1.05),opacity:1,offset:.8,easing:'cubic-bezier(.3,0,.5,1)'},
    {transform:T(dx,dy,s),opacity:0,offset:1}
  ],{duration:DUR,fill:'forwards'});
  setTimeout(()=>{if(el.isConnected)el.style.visibility=''},DUR*.78);
  const end=()=>{closing=false;st.style.willChange='';closeSheet()};
  a.finished.then(end,end);
};
$('dlg').addEventListener('cancel',e=>{if($('dlg').dataset.view==='1'){e.preventDefault();closeViewer()}});

/* girar el libro con el dedo, con inercia */
bindCube=function(){
  const p=$('preview');if(!p)return;
  let down=false,lx=0,lt=0,v=0,raf=0;
  const cu=()=>$('cube');
  const set=a=>{cubeAngle=a;const c=cu();if(c&&!(draft&&draft.display==='Apilado'))c.style.transform=`rotateX(6deg) rotateY(${a}deg)`};
  const stop=()=>{cancelAnimationFrame(raf);raf=0};
  const idle=()=>{const c=cu();if(c)c.style.transition=''};
  p.onpointerdown=e=>{
    if(Date.now()<(window.__flightUntil||0))return;
    down=true;lx=e.clientX;lt=e.timeStamp;v=0;stop();
    const c=cu();if(c)c.style.transition='none';
    try{p.setPointerCapture(e.pointerId)}catch(x){}
  };
  p.onpointermove=e=>{
    if(!down)return;
    const dx=e.clientX-lx,dt=Math.max(1,e.timeStamp-lt);
    v=.6*v+.4*(dx*.8/dt);lx=e.clientX;lt=e.timeStamp;set(cubeAngle+dx*.8);
  };
  const end=()=>{
    if(!down)return;down=false;
    if(Math.abs(v)<.02){idle();return}
    let last=performance.now();
    const step=t=>{
      const dt=Math.min(34,t-last);last=t;set(cubeAngle+v*dt);v*=Math.pow(.93,dt/16);
      if(Math.abs(v)>.012&&cu())raf=requestAnimationFrame(step);else{raf=0;idle()}
    };
    raf=requestAnimationFrame(step);
  };
  p.onpointerup=end;p.onpointercancel=end;
};

/* ───────────────────────────────────────────────────────────
   6) Arranque
   ─────────────────────────────────────────────────────────── */
if(data&&data.books)updateMini();
})();
