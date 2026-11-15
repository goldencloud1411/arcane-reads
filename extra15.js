/* Arcane Reads v2.7 — audiolibros: tocadiscos con disco que gira + insignia 🎧 en las listas */
(function(){
const AUD=b=>b.format==='Audiolibro';
const st=document.createElement('style');st.textContent=`
.tt{margin:30px 6px 130px}.tt h3{display:flex;align-items:center;gap:8px;margin:0 6px 12px;font:600 19px var(--font-title);color:var(--ink)}.tt h3 small{font:500 12px var(--font-body,inherit);color:var(--muted)}
.tt-deck{position:relative;display:grid;grid-template-columns:138px minmax(0,1fr);gap:16px;align-items:center;padding:18px;border-radius:22px;background:linear-gradient(165deg,#9a6a3c,#6a4425 60%,#4d311a);box-shadow:inset 0 1px 0 rgba(255,236,200,.4),0 22px 34px -12px rgba(0,0,0,.65)}
.tt-wrap{position:relative;width:138px;height:138px}
.tt-platter{width:138px;height:138px;border-radius:50%;position:relative;display:grid;place-items:center;background:repeating-radial-gradient(circle,#0d0d10 0 2px,#1a1a1f 3px 4px);box-shadow:0 8px 18px rgba(0,0,0,.6),0 0 0 5px #2a2a30,0 0 0 7px #55555e}
.tt-platter::after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 20deg,transparent 0 20%,rgba(255,255,255,.13) 25%,transparent 32% 70%,rgba(255,255,255,.1) 76%,transparent 82%)}
.tt-platter.spin{animation:ttspin 3.4s linear infinite}@keyframes ttspin{to{transform:rotate(360deg)}}
.tt-label{width:52px;height:52px;border-radius:50%;overflow:hidden;background:#c9a24f;display:grid;place-items:center;box-shadow:0 0 0 3px rgba(0,0,0,.35);position:relative;z-index:1}.tt-label img{width:100%;height:100%;object-fit:cover}
.tt-label::after{content:"";position:absolute;width:8px;height:8px;border-radius:50%;background:#e9e4d8;box-shadow:inset 0 0 0 2px #777}
.tt-arm{position:absolute;right:-4px;top:-2px;width:7px;height:92px;border-radius:4px;background:linear-gradient(90deg,#f1ebdd,#a79d8a);transform-origin:50% 9px;transform:rotate(5deg);transition:transform 1s cubic-bezier(.3,.8,.2,1);z-index:3;box-shadow:2px 3px 6px rgba(0,0,0,.5)}
.tt-arm::before{content:"";position:absolute;top:-8px;left:-8px;width:22px;height:22px;border-radius:50%;background:radial-gradient(#ddd,#6d6d73);box-shadow:0 2px 5px rgba(0,0,0,.5)}
.tt-arm::after{content:"";position:absolute;bottom:-9px;left:-3px;width:13px;height:17px;border-radius:3px;background:#222}.tt-arm.on{transform:rotate(30deg)}
.tt-info{display:grid;gap:5px;min-width:0;color:#fff7e8}.tt-info small{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.75}.tt-info b{font:600 18px/1.15 var(--font-title);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.tt-info span{font-size:13px;opacity:.8}
.tt-btns{display:flex;gap:10px;align-items:center;margin-top:6px}.tt-play{width:46px;height:46px;border-radius:50%;border:0;background:var(--accent);color:#fff;display:grid;place-items:center;box-shadow:0 6px 14px rgba(0,0,0,.4)}.tt-det{border:1px solid rgba(255,247,232,.4);background:transparent;color:#fff7e8;border-radius:99px;padding:9px 14px;font-size:13px}
.tt-crate{display:flex;gap:12px;overflow-x:auto;padding:20px 10px 8px;margin-top:-6px;border-radius:0 0 18px 18px;background:linear-gradient(#3b2614,#26170b);box-shadow:inset 0 8px 14px rgba(0,0,0,.5)}
.tt-rec{flex:0 0 78px;display:grid;gap:5px;border:0;background:none;padding:0;color:#e9dcc4;text-align:left;transition:transform .35s cubic-bezier(.2,.9,.2,1);-webkit-touch-callout:none;user-select:none}
.tt-rec .sq{aspect-ratio:1;border-radius:4px;overflow:hidden;box-shadow:0 8px 12px rgba(0,0,0,.55);position:relative;background:#444}.tt-rec .sq>*{width:100%;height:100%;object-fit:cover}
.tt-rec .sq i{position:absolute;left:0;bottom:0;height:3px;width:var(--p,0%);background:var(--accent)}
.tt-rec span{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tt-rec.sel{transform:translateY(-10px)}.tt-rec.sel .sq{box-shadow:0 0 0 2px var(--accent),0 12px 16px rgba(0,0,0,.6)}
.aud-b{position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;background:rgba(10,10,20,.72);display:grid;place-items:center;color:#fff;z-index:4;pointer-events:none}.aud-b svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
@media(prefers-reduced-motion:reduce){.tt-platter.spin{animation:none}}`;document.head.appendChild(st);
const HP='<svg viewBox="0 0 24 24"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>';
const PLAY='<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
let sel=null;
const live=()=>data.live&&data.live.since?data.live.bookId:null;
function list(sid){return data.books.filter(b=>b.shelf===sid&&AUD(b)&&(!window.__libActive||!__libActive()||__libMatch(b)))}
function tt(sid){
  const l=list(sid);if(!l.length)return'';
  const b=l.find(x=>x.id===sel)||l.find(x=>data.live&&x.id===data.live.bookId)||l.find(x=>x.status==='Leyendo')||l[0];sel=b.id;
  const run=live()===b.id,p=typeof pct==='function'?pct(b):0;
  return `<section class="tt" data-s="${esc(sid)}"><h3>${HP.replace('<svg','<svg width="20" height="20"')} Tocadiscos <small>${l.length} audiolibro${l.length>1?'s':''}</small></h3>
   <div class="tt-deck"><div class="tt-wrap"><div class="tt-platter${run?' spin':''}"><div class="tt-label">${b.cover?`<img src="${esc(b.cover)}" alt="">`:'🎧'}</div></div><div class="tt-arm${run?' on':''}"></div></div>
    <div class="tt-info"><small>${run?'Sonando ahora':b.status==='Leyendo'?'En pausa':b.status==='Leído'?'Terminado':'En el estante'}</small><b>${esc(b.title)}</b><span>${esc(b.author||'')}${b.pages&&p?' · '+p+'%':''}</span>
     <div class="tt-btns"><button class="tt-play" aria-label="Escuchar" onclick="startSession('${b.id}')">${PLAY}</button><button class="tt-det" onclick="bookDetails('${b.id}')">Detalles</button></div></div></div>
   <div class="tt-crate">${l.map(x=>`<button class="tt-rec${x.id===b.id?' sel':''}" data-id="${x.id}" onclick="ttPick('${x.id}')"><div class="sq">${x.cover?`<img src="${esc(x.cover)}" alt="">`:`<div style="background:${esc(x.color||'#555')}"></div>`}<i style="--p:${typeof pct==='function'?pct(x):0}%"></i></div><span>${esc(x.title)}</span></button>`).join('')}</div></section>`}
window.ttPick=id=>{sel=id;const e=document.querySelector('.tt');if(!e)return;const h=tt(e.dataset.s),t=document.createElement('div');t.innerHTML=h;e.replaceWith(t.firstElementChild)};
const _rsp=renderShelfPreview;
renderShelfPreview=function(shelf,large){const all=data.books;let h;data.books=all.filter(b=>!AUD(b));try{h=_rsp(shelf,large)}finally{data.books=all}
  if(large){const t=tt(shelf.id);if(t)h=h.replace(/<\/div>\s*$/,t+'</div>')}return h};
/* insignia 🎧 en tarjetas y listas */
const idOf=el=>el.dataset.id||((el.getAttribute('onclick')||'').match(/\('([^']+)'\)/)||[])[1]||'';
function badges(){document.querySelectorAll('.book-card,.hbook').forEach(el=>{if(el.querySelector('.aud-b'))return;const b=getBook(idOf(el));
  if(b&&AUD(b)){if(getComputedStyle(el).position==='static')el.style.position='relative';el.insertAdjacentHTML('beforeend',`<i class="aud-b" title="Audiolibro">${HP}</i>`)}})}
const _r=render;render=function(){_r();badges()};
/* el disco gira solo mientras hay una sesión corriendo */
setInterval(()=>{const p=document.querySelector('.tt-platter');if(!p)return;const id=document.querySelector('.tt-rec.sel')?.dataset.id,run=live()===id;p.classList.toggle('spin',run);document.querySelector('.tt-arm')?.classList.toggle('on',run)},900);
/* pulsación larga en un disco = menú del libro */
let tm=0,sp=0;const cl=()=>{clearTimeout(tm);tm=0};
document.addEventListener('pointerdown',e=>{const r=e.target.closest&&e.target.closest('.tt-rec');if(!r||$('dlg').open)return;cl();tm=setTimeout(()=>{tm=0;sp=Date.now()+700;try{navigator.vibrate&&navigator.vibrate(18)}catch(x){}window.openBookActions&&openBookActions(r.dataset.id)},420)},{passive:true});
['pointerup','pointercancel','pointermove'].forEach(t=>document.addEventListener(t,cl,{passive:true}));
window.addEventListener('click',e=>{if(Date.now()<sp&&e.target.closest&&e.target.closest('.tt-rec')){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('.tt-rec'))e.preventDefault()});
})();
