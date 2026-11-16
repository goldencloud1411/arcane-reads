/* Arcane Reads v2.6 — barras del sistema integradas + menú de pulsación larga en más lugares */
(function(){
/* 1) color de las barras del sistema = color de la app (adiós barra crema) */
const meta=document.querySelector('meta[name="theme-color"]');
const sync=()=>{try{let c=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if(!c||/gradient|url/.test(c))c=getComputedStyle(document.body).backgroundColor;if(c&&meta)meta.content=c}catch(e){}};
const _r=render;render=function(){_r();sync()};sync();
/* (v2.9.6) sin pantalla completa forzada: la app es "standalone", así que un solo deslizamiento cierra la app como cualquier otra */
/* 3) pulsación larga en portada de "Tu próximo capítulo", sagas y mini reproductor */
const st=document.createElement('style');st.textContent='.hero-book,.saga,.sgc,#mini{-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}.hero-book,.saga,.sgc,#mini{transition:transform .35s cubic-bezier(.2,.9,.2,1)}.lp-hold2{transform:scale(.95)!important}';document.head.appendChild(st);
const SEL='.hero-book,#mini,button[onclick^="openGroup("]',HOLD=420,MOVE=10,buzz=n=>{try{navigator.vibrate&&navigator.vibrate(n)}catch(e){}};
const cur=()=>(data.live&&getBook(data.live.bookId))||data.books.find(b=>b.status==='Leyendo')||null;
function menu(cov,t,s,items){
  showSheet(`<div class="la"><div class="la-head"><div class="la-cov">${cov}</div><div class="la-info"><b>${esc(t)}</b><span>${esc(s)}</span></div><button class="sheet-close" aria-label="Cerrar" onclick="closeSheet()">×</button></div><div class="la-list">${items.map((a,i)=>`<button class="la-btn${a[2]?' la-danger':''}" data-i="${i}"><span>${esc(a[0])}</span></button>`).join('')}</div></div>`);
  const d=$('dlg');d.classList.add('acts');d.querySelectorAll('[data-i]').forEach(b=>b.onclick=items[b.dataset.i][1])}
function sagaMenu(el){
  const m=(el.getAttribute('onclick')||'').match(/openGroup\('(\w+)'/),k=m?m[1]:'saga',n=el.dataset.n,
    bs=data.books.filter(b=>listOf(b,k).includes(n)).sort((a,b)=>(+a.sagaN||9999)-(+b.sagaN||9999)||String(a.year).localeCompare(String(b.year)));
  if(!bs.length)return;const nx=bs.find(b=>b.status==='Leyendo')||bs.find(b=>b.status==='Por leer'),left=bs.filter(b=>b.status!=='Leído').length,A=[];
  A.push(['Ver los '+bs.length+' libros',()=>{closeSheet();openGroup(k,n)}]);
  if(nx)A.push([`${nx.status==='Leyendo'?'Continuar':'Empezar'} «${nx.title}»`,()=>{closeSheet();startSession(nx.id)}]);
  if(left)A.push(['Marcar todo como leído',()=>{if(!confirm(`¿Marcar los ${left} libros pendientes de «${n}» como leídos?`))return;bs.forEach(b=>{if(b.status!=='Leído'){b.status='Leído';b.finished=today();if(b.pages)b.current=b.pages}});closeSheet();rerender();toast('Listo ✦')}]);
  menu(coverHtml(bs[0]),n,`${bs.length} libro${bs.length>1?'s':''} · ${bs.length-left} leído${bs.length-left===1?'':'s'}`,A)}
function miniMenu(){
  const b=cur();if(!b)return;const run=!!(data.live&&data.live.since),pl=document.querySelector('#mini button:not(.mp-open)'),op=document.querySelector('#mini .mp-open');
  const A=[];if(op)A.push(['Abrir sesión de lectura',()=>{closeSheet();op.click()}]);
  if(pl)A.push([run?'Pausar sesión':'Reanudar sesión',()=>{closeSheet();pl.click()}]);
  A.push(['Ver detalles del libro',()=>{closeSheet();bookDetails(b.id)}]);
  menu(coverHtml(b),b.title,run?'Leyendo ahora':'Sesión en pausa',A)}
let timer=0,start=null,tg=null,sup=0;
const cancel=()=>{clearTimeout(timer);timer=0;tg&&tg.classList.remove('lp-hold2');tg=null};
document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;const el=e.target.closest&&e.target.closest(SEL);if(!el||$('dlg').open)return;
  cancel();tg=el;start={x:e.clientX,y:e.clientY};
  timer=setTimeout(()=>{timer=0;sup=Date.now()+700;const t=tg;tg&&tg.classList.remove('lp-hold2');tg=null;buzz(18);
    if(t.matches('button[onclick^="openGroup("]'))sagaMenu(t);else if(t.id==='mini')miniMenu();else{const b=cur();b&&openBookActions(b.id)}},HOLD);
  setTimeout(()=>{if(tg===el&&timer)el.classList.add('lp-hold2')},120)},{passive:true});
document.addEventListener('pointermove',e=>{if(timer&&start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>MOVE)cancel()},{passive:true});
['pointerup','pointercancel','pointerleave'].forEach(t=>document.addEventListener(t,()=>{if(timer)cancel()},{passive:true}));
document.addEventListener('scroll',()=>{if(timer)cancel()},{passive:true,capture:true});
window.addEventListener('click',e=>{if(Date.now()<sup&&e.target.closest&&e.target.closest(SEL)){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener('contextmenu',e=>{const el=e.target.closest&&e.target.closest(SEL);if(!el)return;e.preventDefault();
  if(Date.now()<sup||$('dlg').open)return;sup=Date.now()+700;cancel();buzz(18);if(el.matches('button[onclick^="openGroup("]'))sagaMenu(el);else if(el.id==='mini')miniMenu();else{const b=cur();b&&openBookActions(b.id)}});
})();
