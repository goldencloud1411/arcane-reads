/* Arcane Reads v2.8 — Audioteca: vista propia dentro de Biblioteca, con duración total y progreso */
(function(){
const AUD=b=>b.format==='Audiolibro',live=()=>data.live&&data.live.since?data.live.bookId:null;
const HP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>';
const PLAY='<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',PAUSE='<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
const tot=b=>(+b.audioMins||0)+(+b.audioSecs||0)/60,heard=b=>(data.sessions||[]).filter(s=>s.bookId===b.id).reduce((a,s)=>a+(+(s.minutes||s.mins||s.duration||s.min)||0)+(+s.secs||0)/60,0);
const fd=m=>{const t=Math.round((+m||0)*60);if(t<=0)return'—';const h=Math.floor(t/3600),r=Math.floor(t%3600/60),s=t%60;return [h?h+' h':'',r?r+' min':'',s?s+' s':''].filter(Boolean).join(' ')};
const prog=b=>b.status==='Leído'?100:tot(b)?Math.min(100,Math.round(heard(b)/tot(b)*100)):(typeof pct==='function'?pct(b):0);
let view='shelf',sel=null;try{view=localStorage.getItem('ar_libview')||'shelf'}catch(e){}
const cov=(b,c)=>b.cover?`<img src="${esc(b.cover)}" alt="" draggable="false">`:`<div class="au-ph" style="background:${esc(b.color||'#4b3f6b')}">${HP}</div>`;
const list=sid=>data.books.filter(b=>b.shelf===sid&&AUD(b)&&(!window.__libActive||!__libActive()||__libMatch(b))).sort((a,b)=>String(a.title).localeCompare(String(b.title),'es'));
const st=document.createElement('style');st.textContent=`
.libseg{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin-top:10px;border-radius:16px;background:rgba(0,0,0,.28)}.libseg button{border:0;border-radius:12px;padding:10px 6px;background:transparent;color:var(--muted);font:600 13.5px inherit;display:flex;gap:6px;align-items:center;justify-content:center;transition:background-color .25s,color .25s}.libseg button.on{background:var(--accent-soft);color:var(--ink)}.libseg svg{width:16px;height:16px}
.immersive .shelf-preview{padding-top:max(var(--libtop,300px),285px)!important}
.au-view{padding:max(var(--libtop,300px),285px) 14px 160px;display:grid;gap:24px;animation:auIn .35s cubic-bezier(.2,.9,.2,1)}@keyframes auIn{from{opacity:0;transform:translateY(10px)}}
.au-stats{display:flex;gap:8px;flex-wrap:wrap}.au-stats i{font-style:normal;font-size:12.5px;padding:6px 12px;border-radius:99px;background:rgba(255,255,255,.07);border:1px solid var(--line);color:var(--muted)}.au-stats b{color:var(--ink)}
.au-hero{--c:#6b5aa8;position:relative;display:grid;grid-template-columns:176px minmax(0,1fr);gap:14px;align-items:center;padding:18px 16px;border-radius:26px;background:linear-gradient(155deg,color-mix(in srgb,var(--c) 60%,#0b0d1a),#0b0d1a 85%);border:1px solid rgba(255,255,255,.1);box-shadow:0 22px 40px -20px rgba(0,0,0,.7);overflow:hidden}
.au-art{position:relative;width:176px;height:120px}.au-cover{position:absolute;left:0;top:0;width:120px;height:120px;border-radius:12px;overflow:hidden;z-index:2;box-shadow:0 14px 24px rgba(0,0,0,.6)}.au-cover img,.au-sq img{width:100%;height:100%;object-fit:cover;display:block}
.au-disc{position:absolute;left:52px;top:4px;width:112px;height:112px;border-radius:50%;z-index:1;background:radial-gradient(circle,#c9a24f 0 17%,#111 18% 20%,transparent 21%),repeating-radial-gradient(#0c0c10 0 2px,#1b1b20 3px 4px);box-shadow:0 6px 14px rgba(0,0,0,.6);transition:left .8s cubic-bezier(.3,.8,.2,1)}
.au-hero.playing .au-disc{left:62px;animation:auSpin 3.4s linear infinite}@keyframes auSpin{to{transform:rotate(360deg)}}
.au-meta{display:grid;gap:6px;min-width:0}.au-meta small{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.65)}.au-meta b{font:600 19px/1.15 var(--font-title);color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.au-meta>span{font-size:12.5px;color:rgba(255,255,255,.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.au-bar{height:5px;border-radius:9px;background:rgba(255,255,255,.16);overflow:hidden;margin-top:4px}.au-bar i{display:block;height:100%;width:var(--p,0%);background:linear-gradient(90deg,var(--accent),#f1d28a);border-radius:9px}.au-times{display:flex;justify-content:space-between;font-size:11.5px;color:rgba(255,255,255,.7)}
.au-btns{display:flex;gap:10px;align-items:center;margin-top:4px}.au-play{width:48px;height:48px;border-radius:50%;border:0;background:var(--accent);color:#fff;display:grid;place-items:center;box-shadow:0 8px 16px rgba(0,0,0,.4)}.au-play .ip{display:none}.playing .au-play .ip{display:block}.playing .au-play .ia{display:none}
.au-det{border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;border-radius:99px;padding:9px 14px;font-size:13px}
.eq{display:none;gap:2px;align-items:flex-end;height:16px;color:#f1d28a}.playing .eq{display:inline-flex}.eq i{width:3px;height:40%;background:currentColor;border-radius:2px;animation:eq .8s ease-in-out infinite alternate}.eq i:nth-child(2){animation-delay:-.3s}.eq i:nth-child(3){animation-delay:-.55s}.eq i:nth-child(4){animation-delay:-.15s}@keyframes eq{to{height:100%}}
.au-sec h3{display:flex;align-items:baseline;gap:8px;margin:0 2px 12px;font:600 18px var(--font-title);color:var(--ink)}.au-sec h3 small{font:500 12px inherit;color:var(--muted)}
.au-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 12px}.au-card{display:grid;gap:6px;align-content:start;border:0;background:none;padding:0;text-align:left;color:inherit;-webkit-touch-callout:none;user-select:none}
.au-sq{position:relative;aspect-ratio:1;border-radius:14px;overflow:hidden;box-shadow:0 12px 20px -8px rgba(0,0,0,.65);transition:transform .3s cubic-bezier(.2,.9,.2,1)}.au-card:active .au-sq{transform:scale(.96)}.au-card.sel .au-sq{box-shadow:0 0 0 2px var(--accent),0 12px 20px -8px rgba(0,0,0,.65)}
.au-ph{width:100%;height:100%;display:grid;place-items:center;color:rgba(255,255,255,.8)}.au-ph svg{width:34px;height:34px}
.au-dur{position:absolute;left:6px;bottom:9px;font-size:10.5px;padding:2px 7px;border-radius:99px;background:rgba(10,10,20,.74);color:#fff}.au-sq>i{position:absolute;left:0;bottom:0;height:3px;width:var(--p,0%);background:var(--accent)}
.au-ok{position:absolute;right:6px;top:6px;width:20px;height:20px;border-radius:50%;background:#4fbf7f;color:#fff;display:grid;place-items:center;font-size:12px}
.au-card b{font-size:12.5px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.au-card span{font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.au-empty{display:grid;gap:8px;justify-items:center;text-align:center;padding:40px 20px;border:1px dashed var(--line);border-radius:22px;color:var(--muted)}.au-empty svg{width:40px;height:40px;color:var(--accent)}.au-empty b{color:var(--ink);font:600 18px var(--font-title)}
@media(prefers-reduced-motion:reduce){.au-hero.playing .au-disc,.eq i{animation:none}}`;document.head.appendChild(st);
function html(sid){
  const l=list(sid);if(!l.length)return`<div class="au-view"><div class="au-empty">${HP}<b>Aún no hay audiolibros aquí</b><span>Cambia el formato de un libro a «Audiolibro» en el editor y aparecerá en esta vista.</span></div></div>`;
  const h=l.find(x=>x.id===sel)||l.find(x=>x.id===live())||l.find(x=>x.status==='Leyendo')||l[0];sel=h.id;
  const tt=l.reduce((a,b)=>a+tot(b),0),hh=l.reduce((a,b)=>a+heard(b),0),run=live()===h.id,p=prog(h),left=tot(h)?Math.max(0,tot(h)-heard(h)):0;
  const card=b=>`<button class="au-card${b.id===h.id?' sel':''}" data-id="${b.id}" onclick="auPick('${b.id}')"><div class="au-sq">${cov(b)}${tot(b)?`<span class="au-dur">${fd(tot(b))}</span>`:''}${b.status==='Leído'?'<span class="au-ok">✓</span>':''}<i style="--p:${prog(b)}%"></i></div><b>${esc(b.title)}</b><span>${esc(b.author||'')}</span></button>`;
  const sec=(t,f)=>{const x=l.filter(f);return x.length?`<section class="au-sec"><h3>${t}<small>${x.length}</small></h3><div class="au-grid">${x.map(card).join('')}</div></section>`:''};
  return `<div class="au-view"><div class="au-stats"><i><b>${l.length}</b> audiolibro${l.length>1?'s':''}</i><i><b>${fd(hh)}</b> escuchadas</i>${tt?`<i><b>${fd(tt)}</b> en total</i>`:''}</div>
  <section class="au-hero${run?' playing':''}" style="--c:${esc(h.color||'#6b5aa8')}"><div class="au-art"><div class="au-disc"></div><div class="au-cover">${cov(h)}</div></div>
   <div class="au-meta"><small>${run?'Sonando ahora':h.status==='Leyendo'?'Para continuar':h.status==='Leído'?'Terminado':'Seleccionado'}</small><b>${esc(h.title)}</b><span>${esc(h.author||'')}${h.narrator?' · Narra '+esc(h.narrator):''}</span>
    <div class="au-bar" style="--p:${p}%"><i></i></div><div class="au-times"><span>${fd(heard(h))} · ${p}%</span><span>${tot(h)?'faltan '+fd(left):'sin duración'}</span></div>
    <div class="au-btns"><button class="au-play" aria-label="Escuchar" onclick="auPlay('${h.id}')"><span class="ia">${PLAY}</span><span class="ip">${PAUSE}</span></button><span class="eq"><i></i><i></i><i></i><i></i></span><button class="au-det" onclick="bookDetails('${h.id}')">Detalles</button></div></div></section>
  ${sec('En curso',b=>b.status==='Leyendo')}${sec('Por escuchar',b=>b.status==='Por leer')}${sec('Terminados',b=>b.status==='Leído')}${sec('Otros',b=>!['Leyendo','Por leer','Leído'].includes(b.status))}</div>`}
window.auPick=id=>{sel=id;const e=document.querySelector('.au-view');if(!e)return;const sid=activeShelf().id,t=document.createElement('div');t.innerHTML=html(sid);e.replaceWith(t.firstElementChild);document.querySelector('.au-hero').scrollIntoView({behavior:'smooth',block:'center'})};
window.auPlay=id=>{if(live()===id){const b=document.querySelector('#mini button:not(.mp-open)');b&&b.click()}else startSession(id)};
window.libSeg=v=>{view=v;try{localStorage.setItem('ar_libview',v)}catch(e){}render()};
const _rl=renderLibrary;renderLibrary=function(){const w=_rl(),sh=activeShelf(),n=data.books.filter(b=>b.shelf===sh.id&&AUD(b)).length,s=w.querySelector('select');
  if(s)s.insertAdjacentHTML('afterend',`<div class="libseg"><button class="${view==='shelf'?'on':''}" onclick="libSeg('shelf')">📚 Estantería</button><button class="${view==='audio'?'on':''}" onclick="libSeg('audio')">${HP} Audiolibros${n?' · '+n:''}</button></div>`);
  if(view==='audio'){const e=w.querySelector('.shelf-shell');if(e){const d=document.createElement('div');d.innerHTML=html(sh.id);e.replaceWith(d.firstElementChild)}}
  requestAnimationFrame(()=>{let c=document.querySelector('.libf-row');c=c&&c.closest('.card');if(c)document.documentElement.style.setProperty('--libtop',Math.round(c.getBoundingClientRect().bottom+scrollY+16)+'px')});return w};
/* editor: duración total y narrador */
const _eb=editBook;editBook=function(id,o){_eb(id,o);const sb=$('secBasic');if(!sb||sb.dataset.au||!draft)return;sb.dataset.au=1;
  const m=+draft.audioMins||0,sc=+draft.audioSecs||0,at=$('grSyncMsg')||sb.lastElementChild;
  at.insertAdjacentHTML('afterend',`<label>Audiolibro · duración total</label><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px"><input type="number" min="0" placeholder="horas" value="${m?Math.floor(m/60):''}" oninput="auDur(this,'h')"><input type="number" min="0" max="59" placeholder="minutos" value="${m?m%60:''}" oninput="auDur(this,'m')"><input type="number" min="0" max="59" placeholder="segundos" value="${sc||''}" oninput="auDur(this,'s')"></div><label>Narrador</label><input value="${esc(draft.narrator||'')}" placeholder="Quién narra" oninput="draft.narrator=this.value">`)};
window.auDur=(el,k)=>{const r=el.parentElement.querySelectorAll('input'),h=+r[0].value||0,m=+r[1].value||0;draft.audioMins=h*60+m;draft.audioSecs=Math.min(59,+r[2].value||0)};
/* pulsación larga en un audiolibro = menú de acciones */
let tm=0,sp=0;const cl=()=>{clearTimeout(tm);tm=0};
document.addEventListener('pointerdown',e=>{const r=e.target.closest&&e.target.closest('.au-card');if(!r||$('dlg').open)return;cl();tm=setTimeout(()=>{tm=0;sp=Date.now()+700;try{navigator.vibrate&&navigator.vibrate(18)}catch(x){}window.openBookActions&&openBookActions(r.dataset.id)},420)},{passive:true});
['pointerup','pointercancel','pointermove'].forEach(t=>document.addEventListener(t,cl,{passive:true}));
window.addEventListener('click',e=>{if(Date.now()<sp&&e.target.closest&&e.target.closest('.au-card')){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener('contextmenu',e=>{const r=e.target.closest&&e.target.closest('.au-card');if(!r)return;e.preventDefault();if(Date.now()>sp&&!$('dlg').open){sp=Date.now()+700;window.openBookActions&&openBookActions(r.dataset.id)}});
})();
