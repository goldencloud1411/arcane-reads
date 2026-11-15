/* Arcane Reads v2.3 — mantener presionado un libro = menú de acciones rápidas */
(function(){
const SEL='.shelf-book,.book-card,.hbook,.tonight,.al-row,.au-hero[data-id]';
const HOLD=420, MOVE=10;
const buzz=n=>{try{navigator.vibrate&&navigator.vibrate(n)}catch(e){}};
const I=p=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICO={
  details:I('<path d="M8 4h10a1 1 0 0 1 1 1v12a3 3 0 0 1-3 3H7a3 3 0 0 0 3-3V6a2 2 0 0 0-2-2zm0 0a2 2 0 0 0-2 2v1h4"/><path d="M13 9h4M13 12h4"/>'),
  edit:I('<path d="M20 4c-7 0-12 4-13 11l-2 5 5-2c7-1 11-6 10-14z"/><path d="M7 15l8-6"/>'),
  view3d:I('<path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>'),
  session:I('<path d="M7 3h10M7 21h10M8 3c0 5 4 6 4 9s-4 4-4 9M16 3c0 5-4 6-4 9s4 4 4 9"/>'),
  done:I('<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.2 2.6 2.6 5-5.4"/>'),
  reading:I('<path d="M3 5.5C6 4 9 4.2 12 6c3-1.8 6-2 9-.5V19c-3-1.5-6-1.3-9 .5-3-1.8-6-2-9-.5z"/><path d="M12 6v13.5"/>'),
  tbr:I('<path d="M7 3.5h10v17l-5-4-5 4z"/>'),
  queue:I('<path d="M4 7h11M4 12h11M4 17h7M18 14v6M15 17h6"/>'),
  trash:I('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7M10 11v5.5M14 11v5.5"/>')
};
const idOf=el=>el.dataset.id||((el.getAttribute('onclick')||'').match(/\('([^']+)'\)/)||[])[1]||'';

/* ── detección de pulsación larga ───────────────────────── */
let timer=0,start=null,target=null,suppressUntil=0;
const cancel=()=>{clearTimeout(timer);timer=0;if(target){target.classList.remove('lp-hold');target=null}};
document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  const el=e.target.closest&&e.target.closest(SEL);
  if(!el||$('dlg').open)return;
  const id=idOf(el);if(!id||!getBook(id))return;
  cancel();target=el;start={x:e.clientX,y:e.clientY};
  timer=setTimeout(()=>{
    timer=0;suppressUntil=Date.now()+700;
    if(target){target.classList.remove('lp-hold');target=null}
    buzz(18);openActions(id);
  },HOLD);
  /* efecto de "carga": el libro se encoge un poco mientras mantienes presionado */
  setTimeout(()=>{if(target===el&&timer)el.classList.add('lp-hold')},120);
},{passive:true});
document.addEventListener('pointermove',e=>{
  if(!timer||!start)return;
  if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>MOVE)cancel();
},{passive:true});
['pointerup','pointercancel','pointerleave'].forEach(t=>document.addEventListener(t,()=>{if(timer)cancel()},{passive:true}));
document.addEventListener('scroll',()=>{if(timer)cancel()},{passive:true,capture:true});
/* evita que el toque largo también "abra" el libro, y el menú nativo de imagen de Android */
window.addEventListener('click',e=>{
  if(Date.now()<suppressUntil&&e.target.closest&&e.target.closest(SEL)){e.stopImmediatePropagation();e.preventDefault()}
},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest(SEL))e.preventDefault()});

/* ── menú ──────────────────────────────────────────────── */
function setStatus(id,st){
  const b=getBook(id);if(!b)return;
  b.status=st;
  if(st==='Leído'){b.finished=today();if(b.pages)b.current=b.pages}
  else if(st==='Por leer'||st==='Leyendo'){if(b.finished)b.finished=''}
  if(st==='Leyendo'&&b.pages&&b.current>=b.pages)b.current=0;
  closeSheet();rerender();
  toast(st==='Leído'?'¡Marcado como leído!':st==='Leyendo'?'Ahora lo estás leyendo':'Movido a Por leer');
}
function removeBook(id){
  const b=getBook(id);if(!b)return;
  data.books=data.books.filter(x=>x.id!==id);
  data.queue=(data.queue||[]).filter(x=>x!==id);
  if(data.live&&data.live.bookId===id)data.live=null;
  closeSheet();rerender();toast('Libro eliminado');
}
function confirmDelete(id){
  const b=getBook(id);if(!b)return;
  showSheet(`<div class="la"><div class="la-warn">${ICO.trash}</div><h3 class="la-ct">¿Eliminar este libro?</h3>
   <p class="muted la-cp"><b>${esc(b.title)}</b> se quitará de tu biblioteca. Tus sesiones de lectura y estadísticas se conservan.</p>
   <div class="la-row"><button class="la-btn la-cancel" data-a="cancel">Cancelar</button><button class="la-btn la-del" data-a="del">Eliminar</button></div></div>`);
  $('dlg').classList.add('acts');
  $('dlg').querySelector('.la-cancel').onclick=()=>openActions(id);
  $('dlg').querySelector('.la-del').onclick=()=>removeBook(id);
}
function openActions(id){
  const b=getBook(id);if(!b)return;
  const live=data.live&&data.live.bookId===id&&(data.live.since||data.live.acc);
  const A=[];
  A.push(['details','Ver detalles',ICO.details,()=>{closeSheet();bookDetails(id)}]);
  A.push(['view3d','Ver en 3D',ICO.view3d,()=>{closeSheet();openBook(id)}]);
  A.push(['edit','Editar',ICO.edit,()=>{closeSheet();editBook(id)}]);
  if(b.status!=='Leído')A.push(['session',live?'Continuar sesión':'Empezar sesión de lectura',ICO.session,()=>{startSession(id)}]);
  if(b.status!=='Leído')A.push(['done','Marcar como leído',ICO.done,()=>setStatus(id,'Leído')]);
  if(b.status!=='Leyendo')A.push(['reading',b.status==='Leído'?'Volver a leer':'Marcar como leyendo',ICO.reading,()=>setStatus(id,'Leyendo')]);
  if(b.status!=='Por leer')A.push(['tbr','Marcar como por leer',ICO.tbr,()=>setStatus(id,'Por leer')]);
  if(b.status==='Por leer'&&!(data.queue||[]).includes(id))A.push(['queue','Añadir a “Lo próximo”',ICO.queue,()=>queueAdd(id)]);
  showSheet(`<div class="la"><div class="la-head"><div class="la-cov">${coverHtml(b)}</div><div class="la-info"><b>${esc(b.title)}</b><span>${esc(b.author||'Sin autor')}</span><i class="stp ghost">${esc(b.status||'Por leer')}${b.status==='Leyendo'&&b.pages?' · '+pct(b)+'%':''}</i></div><button class="sheet-close" aria-label="Cerrar" onclick="closeSheet()">×</button></div>
   <div class="la-list">${A.map(a=>`<button class="la-btn" data-a="${a[0]}">${a[2]}<span>${a[1]}</span></button>`).join('')}<button class="la-btn la-danger" data-a="delete">${ICO.trash}<span>Eliminar libro</span></button></div></div>`);
  const d=$('dlg');d.classList.add('acts');
  A.forEach(a=>{const btn=d.querySelector(`[data-a="${a[0]}"]`);if(btn)btn.onclick=a[3]});
  d.querySelector('[data-a="delete"]').onclick=()=>confirmDelete(id);
}
/* el menú se ancla abajo; cualquier otra hoja vuelve a su posición normal */
const _sh=showSheet;
showSheet=function(h){$('dlg').classList.remove('acts');_sh(h)};
window.openBookActions=openActions;
})();
