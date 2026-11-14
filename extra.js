/* Arcane Reads v0.8 — pantallas tipo SlowRead */
const dayStr=n=>{const d=new Date();d.setDate(d.getDate()-n);return ymd(d)};
const minsOn=d=>data.sessions.filter(s=>s.date===d).reduce((a,s)=>a+(+s.minutes||0),0);
const QUOTES=[['Un lector vive mil vidas antes de morir. El que nunca lee vive solo una.','George R.R. Martin'],['Un libro es un sueño que sostienes en tus manos.','Neil Gaiman']];
const chart=(v,l)=>{const m=Math.max(1,...v);return `<div class="bars">${v.map((x,i)=>`<div class="bc"><em>${x||''}</em><i style="height:${Math.max(x?6:2,x/m*100)}%"></i><span>${l[i]}</span></div>`).join('')}</div>`};
const hb=b=>`<button class="hbook" onclick="openBook('${b.id}')"><div class="hcov">${coverHtml(b)}</div><b>${esc(b.title)}</b><span>${esc(b.author||'')}</span></button>`;
const finished=b=>b.finished||'';
(function(){const sb=saveBook;saveBook=function(){if(draft&&draft.status==='Leído'&&!draft.finished)draft.finished=today();sb()};
const ss=saveSession;saveSession=function(){const b=getBook($('sessBook').value);ss();if(b&&b.status==='Leído'&&!b.finished){b.finished=today();save()}}})();

renderHome=function(){
  const w=document.createElement('div');w.className='section-gap';
  const cur=readingBooks()[0],wk=[...Array(7)].map((_,i)=>dayStr(6-i)),tm=minsOn(today()),st=streakDays(),yr=String(new Date().getFullYear());
  const done=doneBooks().filter(b=>!finished(b)||finished(b).startsWith(yr)),notes=(data.notes||[]),n=notes[notes.length-1],q=QUOTES[new Date().getDate()%QUOTES.length];
  const mp=data.sessions.filter(s=>s.date.startsWith(today().slice(0,7))).reduce((a,s)=>a+(+s.pages||0),0);
  w.innerHTML=`
  <section class="card hero"><div class="flame ${st?'on':''}">🔥<b>${st}</b></div>
    <div class="hero-book">${cur?.cover?`<img src="${cur.cover}" alt="">`:'📖'}</div>
    <div class="hero-copy"><div class="eyebrow">Tu próximo capítulo</div><h2>${cur?esc(cur.title):'¿Qué estás leyendo?'}</h2><p>${cur?`${esc(cur.author||'')} · Página ${cur.current||0} de ${cur.pages||'—'}`:'Elige un libro de tu biblioteca para empezar una sesión de lectura pausada.'}</p>${cur&&cur.pages?bar(pct(cur)):''}</div>
    <div class="hero-actions"><button class="btn" onclick="${cur?`openReadingSession('${cur.id}')`:'setTab(\'Libros\')'}">${cur?'Empezar sesión':'Elige un libro'}</button><button class="btn-ghost" onclick="spinRoulette()">Elige tu próximo libro</button></div></section>
  <section class="card"><div class="label-row"><h2>Tu biblioteca</h2><button class="link-btn" onclick="setTab('Biblioteca')">Abrir</button></div>${renderShelfPreview(activeShelf())}</section>
  <section class="card"><div class="label-row"><div><h3>${st?st+(st>1?' días':' día')+' de racha':'Empieza tu racha'}</h3><div class="muted small">Lee 20 minutos y hoy cuenta.</div></div><div class="ring" style="background:conic-gradient(var(--accent) ${Math.min(100,tm/20*100)}%,var(--line) 0)"><span>${tm}/20</span></div></div><div class="dots">${wk.map(d=>`<i class="${minsOn(d)?'on':''} ${d===today()?'td':''}"></i>`).join('')}</div></section>
  <section class="card"><div class="label-row"><h3>Esta semana</h3><button class="link-btn" onclick="setTab('Estadísticas')">Estadísticas ›</button></div>${chart(wk.map(minsOn),wk.map(d=>'DLMMJVS'[new Date(d+'T12:00').getDay()]))}<div class="muted small" style="text-align:center">minutos por día</div></section>
  <section class="card goal"><div class="eyebrow">Tu ${yr}</div><div class="gshelf">${[...Array(Math.max(7,0))].map((_,i)=>{const b=done[done.length-7+i]||done[i];const bk=done.length>7?done[done.length-7+i]:done[i];return `<i style="${bk?`background:${bk.color||'#7b5472'}`:''}">${bk?.cover?`<img src="${bk.cover}" alt="">`:''}</i>`}).join('')}</div><h3 style="color:#fff">${done.length}/${data.goal} libros este año</h3><button class="btn-soft gold" onclick="setGoal()">Fijar objetivo</button></section>
  <section class="card note"><div class="label-row"><h3>Cuaderno</h3>${notes.length?`<button class="link-btn" onclick="notesDialog()">Ver todas (${notes.length})</button>`:''}</div><p class="hand">${n?esc(n.text):'Aquí irá tu primera cita, teoría o nota…'}</p><div class="label-row"><span class="muted small">Guardada con su libro y su página.</span><button class="btn-soft" onclick="noteDialog()">Escribir una nota</button></div></section>
  <section class="grid-2"><div class="card mini dusk"><div class="eyebrow">Lo próximo</div><h3>Elige tu próxima lectura</h3><button class="mini-btn" onclick="spinRoulette()">🎲 Girar la ruleta</button></div><div class="card mini rose"><div class="eyebrow">Este mes</div><h3>${mp} páginas</h3><div class="small">${readDaysThisMonth()} días leídos</div></div></section>
  <section class="card quote"><p>“${q[0]}”</p><div class="muted small">${q[1]}</div></section>`;
  return w};
function setGoal(){const v=prompt('¿Cuántos libros quieres leer este año?',data.goal);if(v&&+v>0){data.goal=Math.round(+v);rerender()}}
function noteDialog(){showSheet(`<div class="sheet-header"><h2>Nueva nota</h2><button class="sheet-close" onclick="closeSheet()">×</button></div><div class="field"><label>Libro</label><select id="nBook"><option value="">Sin libro</option>${data.books.map(b=>`<option value="${b.id}">${esc(b.title)}</option>`).join('')}</select><label>Página</label><input id="nPage" type="number" min="0" inputmode="numeric"><label>Cita, teoría o nota</label><textarea id="nText" rows="5"></textarea></div><button class="btn-soft" style="margin-top:14px;width:100%" onclick="saveNote()">Guardar nota</button>`)}
function saveNote(){const t=$('nText').value.trim();if(!t)return toast('Escribe algo primero');(data.notes=data.notes||[]).push({id:uid(),bookId:$('nBook').value,page:+$('nPage').value||0,text:t,date:today()});closeSheet();rerender();toast('Nota guardada')}
function notesDialog(){showSheet(`<div class="sheet-header"><h2>Cuaderno</h2><button class="sheet-close" onclick="closeSheet()">×</button></div><div class="list">${(data.notes||[]).slice().reverse().map(n=>`<div class="card note"><p class="hand">${esc(n.text)}</p><div class="muted small">${esc(getBook(n.bookId)?.title||'Sin libro')}${n.page?' · pág. '+n.page:''} · ${n.date}</div><button class="link-btn" onclick="data.notes=data.notes.filter(x=>x.id!=='${n.id}');save();notesDialog()">Eliminar</button></div>`).join('')||'<div class="empty">Aún no hay notas.</div>'}</div>`)}
function startReading(id){const b=getBook(id);if(b)b.status='Leyendo';closeSheet();rerender();toast('¡A leer!')}
function queueAdd(id){data.queue=[...new Set([...(data.queue||[]),id])];closeSheet();rerender();toast('Añadido a Lo próximo')}
function spinRoulette(){const p=unreadBooks();if(!p.length){toast('Añade libros por leer primero');return}
  showSheet(`<div class="sheet-header"><h2>La ruleta</h2><button class="sheet-close" onclick="closeSheet()">×</button></div><div id="rl" class="roul"></div><div id="rlt" style="text-align:center;margin:12px 0;min-height:70px"></div>`);
  const pick=p[Math.random()*p.length|0];let n=0;const t=setInterval(()=>{const last=++n>14,b=last?pick:p[n%p.length];$('rl').innerHTML=hb(b).replace(/onclick="[^"]*"/,'');
    if(last){clearInterval(t);$('rlt').innerHTML=`<div class="editor-save-row"><button class="btn-soft" onclick="startReading('${pick.id}')">Empezar a leer</button><button class="mini-btn" onclick="queueAdd('${pick.id}')">A lo próximo</button></div><button class="link-btn" style="margin-top:10px" onclick="spinRoulette()">Girar otra vez</button>`}},110)}
function openReadingSession(id){let acc=0,st=0,t=null;const f=s=>`${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`,el=()=>acc+(st?Math.floor((Date.now()-st)/1000):0);
  showSheet(`<div class="sheet-header"><div><h2>Sesión de lectura</h2><div class="muted small">${esc(getBook(id)?.title||'')}</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div><div class="timer" id="tm">00:00</div><div class="editor-save-row"><button class="btn-soft" id="tg">Empezar</button><button class="mini-btn" id="tf">Terminar y guardar</button></div>`);
  $('tg').onclick=()=>{if(st){acc=el();st=0;clearInterval(t);$('tg').textContent='Continuar'}else{st=Date.now();t=setInterval(()=>$('tm').textContent=f(el()),500);$('tg').textContent='Pausar'}};
  $('tf').onclick=()=>{const s=el();clearInterval(t);closeSheet();sessionDialog();setTimeout(()=>{$('sessBook').value=id;$('sessMins').value=Math.max(1,Math.round(s/60))},60)};
  $('dlg').addEventListener('close',()=>clearInterval(t),{once:true})}

const _rb=renderBooks;let bt='Para ti';
const grp=k=>{const m={};data.books.forEach(b=>String(b[k]||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(n=>(m[n]=m[n]||[]).push(b)));return Object.entries(m)};
const stack=([n,bs])=>`<div class="saga"><div class="sg">${bs.slice(0,3).map(b=>`<div class="hcov">${coverHtml(b)}</div>`).join('')}</div><b>${esc(n)}</b><span>${bs.length} libro${bs.length>1?'s':''}</span></div>`;
renderBooks=function(){
  const all=bt==='Todos',w=all?_rb():document.createElement('div');if(!all){w.className='section-gap';w.innerHTML='<section><div class="label-row"><h2>Tus libros</h2><button class="mini-btn" onclick="openAddBookFlow()">+ Añadir</button></div></section>'}
  const c=document.createElement('div');c.className='tabs';c.innerHTML=[['Para ti','Para ti'],['Leyendo',`Leyendo ahora · ${readingBooks().length}`],['Por leer',`Por leer · ${unreadBooks().length}`],['Todos','Todos']].map(([k,t])=>`<button class="chip ${bt===k?'active':''}" onclick="bt='${k}';render()">${t}</button>`).join('');w.prepend(c);
  if(all)return w;
  if(bt!=='Para ti'){const l=data.books.filter(b=>b.status===(bt==='Leyendo'?'Leyendo':'Por leer'));w.insertAdjacentHTML('beforeend',l.length?`<section><div class="book-grid">${l.map(bookCard).join('')}</div></section>`:'<div class="empty">No hay libros aquí todavía.</div>');return w}
  const q=(data.queue||[]).map(getBook).filter(b=>b&&b.status==='Por leer'),u=unreadBooks(),sg=grp('saga'),co=grp('collection');
  w.insertAdjacentHTML('beforeend',`
  <section class="card"><div class="label-row"><h2>Lo próximo</h2><button class="mini-btn" onclick="spinRoulette()">🎲 Girar</button></div>${q.length?`<div class="hrow">${q.map(hb).join('')}</div>`:'<div class="muted small">Aún no hay nada en la cola. Gira la ruleta para llenarla.</div>'}</section>
  <section><div class="label-row"><h2>Por leer</h2><button class="link-btn" onclick="bt='Por leer';render()">Ver todo ›</button></div>${u.length?`<div class="hrow">${u.map(hb).join('')}</div>`:'<div class="empty">Nada pendiente. ¡Añade un libro!</div>'}</section>
  <section><h2>Sagas</h2>${sg.length?`<div class="hrow">${sg.map(stack).join('')}</div>`:'<div class="empty">Escribe la saga al editar un libro y se agruparán aquí.</div>'}</section>
  <section><h2>Colecciones</h2>${co.length?`<div class="hrow">${co.map(stack).join('')}</div>`:'<div class="empty">Escribe una colección al editar un libro y se agruparán aquí.</div>'}</section>`);
  return w};

const _rs=renderStats;let stat={p:'Mensual',m:'Páginas'};
function buckets(p){const n=new Date(),L='DLMMJVS';
  if(p==='Diario')return[...Array(7)].map((_,i)=>{const k=6-i,ds=dayStr(k),d=new Date(n);d.setDate(n.getDate()-k);return{l:L[d.getDay()],t:x=>x===ds}});
  if(p==='Semanal')return[...Array(8)].map((_,i)=>{const k=7-i,a=dayStr(k*7+6),b=dayStr(k*7);return{l:a.slice(8)+'/'+a.slice(5,7),t:x=>x>=a&&x<=b}});
  if(p==='Anual')return[...Array(12)].map((_,i)=>{const pre=n.getFullYear()+'-'+String(i+1).padStart(2,'0');return{l:'EFMAMJJASOND'[i],t:x=>x.startsWith(pre)}});
  const dim=new Date(n.getFullYear(),n.getMonth()+1,0).getDate(),pre=today().slice(0,8);return[...Array(dim)].map((_,i)=>{const ds=pre+String(i+1).padStart(2,'0');return{l:[1,8,15,22,29].includes(i+1)?String(i+1):'',t:x=>x===ds}})}
const val=(b,m)=>m==='Libros'?doneBooks().filter(k=>k.finished&&b.t(k.finished)).length:data.sessions.filter(s=>b.t(s.date)).reduce((a,s)=>a+(+(m==='Páginas'?s.pages:s.minutes)||0),0);
renderStats=function(){const w=document.createElement('div');w.className='section-gap';const bk=buckets(stat.p),tot=m=>bk.reduce((a,b)=>a+val(b,m),0);
  w.innerHTML=`<section><h2>Tu lectura</h2><div class="segmented seg4">${['Diario','Semanal','Mensual','Anual'].map(p=>`<button class="${stat.p===p?'active':''}" onclick="stat.p='${p}';render()">${p}</button>`).join('')}</div></section>
  <section class="card"><div class="metric-grid">${[['Páginas','Páginas'],['Tiempo','min'],['Libros','Libros']].map(([m,u])=>`<button class="metric ${stat.m===m?'sel':''}" onclick="stat.m='${m}';render()"><div class="n">${tot(m)}</div><div class="muted small">${u==='min'?'Minutos':m}</div></button>`).join('')}</div>${chart(bk.map(b=>val(b,stat.m)),bk.map(b=>b.l))}</section>
  <section class="label-row"><span>🔥 Racha ${streakDays()} días</span><span class="muted">Días leídos ${readDaysThisMonth()}</span></section>`;
  [..._rs().children].slice(2).forEach(e=>w.appendChild(e));return w};
