/* Arcane Reads v2.9.7 — Registrar sesión de AUDIOLIBRO: horas/minutos o hasta qué %; páginas solo si también leíste (lectura inmersiva) */
(function(){
const AUD=b=>b&&b.format==='Audiolibro',tot=b=>(+b.audioMins||0)+(+b.audioSecs||0)/60;
const heard=b=>(data.sessions||[]).filter(s=>s.bookId===b.id).reduce((a,s)=>a+(+(s.minutes||s.mins||s.duration||s.min)||0)+(+s.secs||0)/60,0);
const fd=m=>{const t=Math.round((+m||0)*60);if(t<=0)return'0 min';const h=Math.floor(t/3600),r=Math.floor(t%3600/60),s=t%60;return [h?h+' h':'',r?r+' min':'',s?s+' s':''].filter(Boolean).join(' ')};
const st=document.createElement('style');st.textContent='.as-seg{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin:8px 0 2px;border-radius:14px;background:rgba(0,0,0,.28)}.as-seg button{border:0;border-radius:11px;padding:10px 6px;background:transparent;color:var(--muted);font:600 13.5px inherit;transition:background-color .25s,color .25s}.as-seg button.on{background:var(--accent-soft);color:var(--ink)}.as-chk{display:flex!important;gap:10px;align-items:center;margin-top:12px;color:var(--ink)}.as-chk input{width:20px;height:20px;flex:none}#asHint{line-height:1.45}';document.head.appendChild(st);
const dI=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'),dS=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
let cur=null; /* estado del diálogo abierto */
function adapt(){
  const sel=$('sessBook'),mins=$('sessMins'),pg=$('sessPages');if(!sel||!mins||!pg||sel.dataset.as)return;sel.dataset.as=1;
  const row=pg.closest('.swatch-row'),host=document.createElement('div');row.parentNode.insertBefore(host,row.nextSibling);
  const S={sel,mins,pg,row,host,mode:'time',edited:false,m:0,pages:0};cur=S;
  const setM=v=>dI.set.call(mins,String(v)),setP=v=>dI.set.call(pg,String(v));
  const book=()=>getBook(dS.get.call(sel));
  function calc(){const b=book();if(!AUD(b))return;const q=id=>$(id);let m=0,sc=0,ts=0;
    if(S.mode==='time')ts=Math.round((+q('asH').value||0)*3600+(+q('asM').value||0)*60+(+q('asS').value||0));
    else{const p=Math.min(100,Math.max(0,+q('asP').value||0));ts=Math.max(0,Math.round((p/100*tot(b)-heard(b))*60))}
    m=Math.floor(ts/60);sc=ts%60;const mm=m+sc/60;
    const pages=q('asRead').checked?Math.max(0,+q('asPg').value||0):0;S.m=m;S.secs=sc;S.pages=pages;setM(m);setP(pages);
    const h=heard(b),T=tot(b),hint=q('asHint');let t='';
    if(S.mode==='pct'){if(!T)t='Para usar el porcentaje, agrega la duración total del audiolibro en «Editar».';else if(!q('asP').value)t=`Llevas ${fd(h)} (${Math.round(h/T*100)}%). Escribe hasta qué % escuchaste.`;else t=m?`Llevabas ${fd(h)} (${Math.round(h/T*100)}%). Hasta el ${Math.min(100,+q('asP').value)}% son ${fd(Math.round(Math.min(100,+q('asP').value)/100*T))}; se registran ${fd(mm)}.`:'Ya ibas más adelante que ese porcentaje, no se agrega tiempo.'}
    else t=m?(T?`Con esto llegas a ${fd(h+mm)} de ${fd(T)} (${Math.min(100,Math.round((h+mm)/T*100))}%).`:`Se suman ${fd(mm)} a tu progreso.`):'Escribe cuánto tiempo escuchaste hoy.';
    hint.textContent=t}
  function fillFromMins(){if(S.edited||S.mode!=='time')return;const m=+dI.get.call(mins)||0,H=$('asH'),M=$('asM');if(H&&M){H.value=m?Math.floor(m/60):'';M.value=m?m%60:'';calc()}}
  function draw(){const b=book();
    if(!AUD(b)){host.innerHTML='';row.hidden=false;S.audio=false;const sub=document.querySelector('#dlg .sheet-header .muted.small');if(sub)sub.textContent='Páginas y tiempo de hoy';return}
    S.audio=true;row.hidden=true;const sub=document.querySelector('#dlg .sheet-header .muted.small');if(sub)sub.textContent='Tiempo escuchado hoy';
    host.innerHTML=`<div class="as-seg"><button type="button" data-m="time" class="${S.mode==='time'?'on':''}">Tiempo escuchado</button><button type="button" data-m="pct" class="${S.mode==='pct'?'on':''}">Hasta el %</button></div>
     <div id="asTime" ${S.mode==='time'?'':'hidden'} class="swatch-row" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><label>Horas</label><input id="asH" type="number" min="0" inputmode="numeric" placeholder="0"></div><div><label>Minutos</label><input id="asM" type="number" min="0" max="59" inputmode="numeric" placeholder="0"></div><div><label>Segundos</label><input id="asS" type="number" min="0" max="59" inputmode="numeric" placeholder="0"></div></div>
     <div id="asPct" ${S.mode==='pct'?'':'hidden'}><label>Hasta qué porcentaje escuchaste</label><input id="asP" type="number" min="0" max="100" step="any" inputmode="decimal" placeholder="Ej. 45"></div>
     <div class="muted small" id="asHint" style="margin-top:8px"></div>
     <label class="as-chk"><input type="checkbox" id="asRead"> También leí el libro mientras escuchaba (lectura inmersiva)</label>
     <div id="asPages" hidden><label>Páginas leídas</label><input id="asPg" type="number" min="0" inputmode="numeric" placeholder="0"></div>`;
    host.querySelectorAll('.as-seg button').forEach(x=>x.onclick=()=>{S.mode=x.dataset.m;S.edited=true;draw()});
    ['asH','asM','asS','asP','asPg'].forEach(id=>{const e=$(id);e&&e.addEventListener('input',()=>{S.edited=true;calc()})});
    $('asRead').onchange=e=>{$('asPages').hidden=!e.target.checked;calc()};
    const m0=+dI.get.call(mins)||0;if(S.mode==='time'&&m0&&!S.edited){$('asH').value=Math.floor(m0/60)||'';$('asM').value=m0%60||''}calc()}
  /* otros scripts rellenan libro y minutos por código (al terminar una sesión en vivo): los seguimos */
  Object.defineProperty(sel,'value',{get(){return dS.get.call(this)},set(v){dS.set.call(this,v);S.edited=false;draw()},configurable:true});
  Object.defineProperty(mins,'value',{get(){return dI.get.call(this)},set(v){dI.set.call(this,v);fillFromMins()},configurable:true});
  sel.addEventListener('change',()=>{S.edited=false;draw()});draw()}
const _sd=sessionDialog;sessionDialog=function(){cur=null;_sd();adapt()};
const _ss=saveSession;saveSession=function(){
  const S=cur&&cur.sel&&cur.sel.isConnected?cur:null,b=S?getBook(dS.get.call(S.sel)):null;
  if(S&&S.audio&&AUD(b)){const a=$('asHint');if(!S.m&&!S.secs&&!S.pages){toast(S.mode==='pct'?'Escribe hasta qué porcentaje escuchaste':'Escribe cuánto tiempo escuchaste');return}}
  _ss();
  if(S&&S.audio&&AUD(b)){const s=data.sessions[data.sessions.length-1];if(s&&s.bookId===b.id){s.audio=true;if(S.secs)s.secs=S.secs}
    if(tot(b)&&heard(b)>=tot(b)*.985&&b.status!=='Leído'){b.status='Leído';b.finished=today();save();rerender();toast('¡Terminaste el audiolibro! ✦')}}
};
})();
