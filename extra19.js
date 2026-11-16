/* Arcane Reads v2.9.8 — corregir progreso y editar/eliminar sesiones desde la ficha del libro */
(function(){
const AUD=b=>b&&b.format==='Audiolibro',tot=b=>(+b.audioMins||0)+(+b.audioSecs||0)/60;
const secsOf=s=>Math.round(((+(s.minutes||s.mins||s.duration||s.min)||0)*60)+(+s.secs||0));
const heardS=b=>(data.sessions||[]).filter(s=>s.bookId===b.id).reduce((a,s)=>a+secsOf(s),0);
const fdS=t=>{t=Math.round(t);if(t<=0)return'0 min';const h=Math.floor(t/3600),r=Math.floor(t%3600/60),s=t%60;return[h?h+' h':'',r?r+' min':'',s?s+' s':''].filter(Boolean).join(' ')};
const setS=(s,t)=>{s.minutes=Math.floor(t/60);s.secs=t%60};
const st=document.createElement('style');
st.textContent='.ss-sec{display:grid;gap:10px}.ss-sec h3{margin:6px 0 0}.ss-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}.ss-row:last-child{border-bottom:0}.ss-row b{display:block;font-weight:600}.ss-row span{color:var(--muted);font-size:13px}.ss-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ss-form{display:grid;gap:10px}.ss-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}[hidden]{display:none!important}';
document.head.appendChild(st);
const back=id=>{closeSheet();rerender();setTimeout(()=>bookDetails(id),60)};
const sessOf=id=>(data.sessions||[]).filter(s=>s.bookId===id);
/* ── sección en la ficha ── */
function block(b){
  const ss=sessOf(b.id).slice().reverse(),shown=ss.slice(0,10);
  const row=s=>`<div class="ss-row"><div><b>${esc(s.date||'')}</b><span>${AUD(b)||(!(+s.pages)&&secsOf(s))?fdS(secsOf(s)):`${+s.pages||0} pág.${secsOf(s)?' · '+fdS(secsOf(s)):''}`}</span></div><button class="mini-btn" type="button" onclick="ssEdit('${s.id}')">Editar</button></div>`;
  const h=heardS(b),T=tot(b)*60;
  const top=AUD(b)
    ?`<div class="muted small">${T?`Llevas ${fdS(h)} de ${fdS(T)} (${Math.min(100,Math.round(h/T*100))}%)`:`Llevas ${fdS(h)}`}</div><div class="ss-acts"><button class="mini-btn" type="button" onclick="ssFix('${b.id}')">Corregir progreso</button></div>`
    :`<div class="muted small">Página ${b.current||0}${b.pages?' de '+b.pages:''}</div><div class="ss-acts"><button class="mini-btn" type="button" onclick="ssFix('${b.id}')">Corregir página actual</button></div>`;
  return`<section class="ss-sec" data-id="${b.id}"><h3>Progreso y sesiones</h3>${top}${ss.length?`<div>${shown.map(row).join('')}</div>${ss.length>shown.length?`<div class="muted small">Mostrando las ${shown.length} más recientes de ${ss.length}.</div>`:''}`:'<div class="muted small">Aún no hay sesiones registradas.</div>'}</section>`}
new MutationObserver(()=>{const db=document.querySelector('.dt-body');if(!db||db.querySelector('.ss-sec'))return;
  const btn=document.querySelector('.dt-bar [onclick*="startSession("]'),m=btn&&(btn.getAttribute('onclick')||'').match(/'([^']+)'/),b=m&&getBook(m[1]);if(!b)return;
  const anchor=[...db.querySelectorAll('h3')].find(h=>/Mi rese|Notas y citas/i.test(h.textContent));
  if(anchor)anchor.insertAdjacentHTML('beforebegin',block(b));else db.insertAdjacentHTML('beforeend',block(b))}).observe($('dlg'),{childList:true,subtree:true});
/* ── corregir progreso total ── */
window.ssFix=id=>{const b=getBook(id);if(!b)return;
  if(!AUD(b)){
    showSheet(`<div class="sheet-header"><div><h2>Corregir página actual</h2><div class="muted small">${esc(b.title)}</div></div><button class="sheet-close" onclick="ssBack('${id}')">×</button></div><div class="ss-form"><label>Página actual${b.pages?' (de '+b.pages+')':''}</label><input id="ssCur" type="number" min="0" inputmode="numeric" value="${b.current||0}"><button class="btn-soft" type="button" onclick="ssFixBookSave('${id}')">Guardar</button></div>`);return}
  const h=heardS(b);
  showSheet(`<div class="sheet-header"><div><h2>Corregir progreso</h2><div class="muted small">${esc(b.title)}</div></div><button class="sheet-close" onclick="ssBack('${id}')">×</button></div>
   <div class="ss-form"><div class="muted small">Ahora: ${fdS(h)}${tot(b)?' ('+Math.round(h/(tot(b)*60)*1000)/10+'%)':''}. Escribe el tiempo <b>total</b> que llevas, como lo marca tu app de audiolibros.</div>
   <div class="ss-grid"><div><label>Horas</label><input id="ssH" type="number" min="0" inputmode="numeric" value="${Math.floor(h/3600)}"></div><div><label>Minutos</label><input id="ssM" type="number" min="0" max="59" inputmode="numeric" value="${Math.floor(h%3600/60)}"></div><div><label>Segundos</label><input id="ssS" type="number" min="0" max="59" inputmode="numeric" value="${h%60}"></div></div>
   ${tot(b)?`<label>…o el porcentaje total</label><input id="ssP" type="number" min="0" max="100" step="any" inputmode="decimal" placeholder="Ej. 25">`:''}
   <button class="btn-soft" type="button" onclick="ssFixSave('${id}')">Guardar</button></div>`)};
window.ssBack=id=>{closeSheet();setTimeout(()=>bookDetails(id),60)};
window.ssFixBookSave=id=>{const b=getBook(id),v=Math.max(0,Math.round(+$('ssCur').value||0));b.current=b.pages?Math.min(b.pages,v):v;
  if(b.pages&&b.current>=b.pages)b.status='Leído';else if(b.status==='Leído'){b.status='Leyendo';b.finished=''}
  toast('Progreso actualizado');back(id)};
window.ssFixSave=id=>{const b=getBook(id);if(!b)return;
  let target=Math.round((+$('ssH').value||0)*3600+(+$('ssM').value||0)*60+(+$('ssS').value||0));
  const P=$('ssP');if(P&&P.value!=='')target=Math.round(Math.min(100,Math.max(0,+P.value||0))/100*tot(b)*60);
  let d=target-heardS(b);const mine=sessOf(id);
  if(d>0){if(mine.length){const s=mine[mine.length-1];setS(s,secsOf(s)+d)}else data.sessions.push({id:uid(),bookId:id,date:today(),pages:0,minutes:Math.floor(d/60),secs:d%60,audio:true})}
  else if(d<0){for(let i=mine.length-1;i>=0&&d<0;i--){const s=mine[i],t=secsOf(s),take=Math.min(t,-d);setS(s,t-take);d+=take}}
  const T=tot(b)*60;
  if(T&&target>=T*.985){if(b.status!=='Leído'){b.status='Leído';b.finished=today()}}
  else{if(b.status==='Leído'){b.status='Leyendo';b.finished=''}if(target>0&&b.status==='Por leer')b.status='Leyendo'}
  toast('Progreso actualizado');back(id)};
/* ── editar / eliminar una sesión ── */
window.ssEdit=sid=>{const s=(data.sessions||[]).find(x=>x.id===sid);if(!s)return;const b=getBook(s.bookId);if(!b)return;const t=secsOf(s);
  const time=AUD(b)
   ?`<div class="ss-grid"><div><label>Horas</label><input id="seH" type="number" min="0" inputmode="numeric" value="${Math.floor(t/3600)}"></div><div><label>Minutos</label><input id="seM" type="number" min="0" max="59" inputmode="numeric" value="${Math.floor(t%3600/60)}"></div><div><label>Segundos</label><input id="seS" type="number" min="0" max="59" inputmode="numeric" value="${t%60}"></div></div>`
   :`<div class="ss-grid" style="grid-template-columns:1fr 1fr"><div><label>Páginas leídas</label><input id="sePg" type="number" min="0" inputmode="numeric" value="${+s.pages||0}"></div><div><label>Minutos</label><input id="seMin" type="number" min="0" inputmode="numeric" value="${Math.round(t/60)}"></div></div>`;
  showSheet(`<div class="sheet-header"><div><h2>Editar sesión</h2><div class="muted small">${esc(b.title)}</div></div><button class="sheet-close" onclick="ssBack('${b.id}')">×</button></div>
   <div class="ss-form"><label>Fecha</label><input id="seD" type="date" value="${esc(s.date||today())}">${time}
   <button class="btn-soft" type="button" onclick="ssEditSave('${sid}')">Guardar cambios</button>
   <button class="mini-btn" type="button" onclick="ssDelete('${sid}')">Eliminar esta sesión</button></div>`)};
window.ssEditSave=sid=>{const s=data.sessions.find(x=>x.id===sid),b=s&&getBook(s.bookId);if(!b)return;
  s.date=$('seD').value||s.date;
  if(AUD(b)){setS(s,Math.round((+$('seH').value||0)*3600+(+$('seM').value||0)*60+(+$('seS').value||0)))}
  else{const np=Math.max(0,Math.round(+$('sePg').value||0)),old=+s.pages||0;s.pages=np;s.minutes=Math.max(0,Math.round(+$('seMin').value||0));s.secs=0;
    b.current=Math.max(0,Math.min(b.pages||Infinity,(+b.current||0)+np-old));if(b.pages&&b.current>=b.pages)b.status='Leído'}
  toast('Sesión actualizada');back(b.id)};
window.ssDelete=sid=>{const s=data.sessions.find(x=>x.id===sid),b=s&&getBook(s.bookId);if(!s||!confirm('¿Eliminar esta sesión?'))return;
  data.sessions=data.sessions.filter(x=>x.id!==sid);
  if(b&&!AUD(b)){b.current=Math.max(0,(+b.current||0)-(+s.pages||0));if(b.status==='Leído'&&b.pages&&b.current<b.pages)b.status='Leyendo'}
  toast('Sesión eliminada');back(b?b.id:'')};
})();
