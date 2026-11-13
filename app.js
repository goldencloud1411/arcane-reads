
let db;
const $ = id=>document.getElementById(id);
const esc = x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid = ()=>crypto.randomUUID?.() || (Date.now().toString(36)+Math.random().toString(36).slice(2));
const today = ()=>new Date().toISOString().slice(0,10);
const monthName = ()=>new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric'}).format(new Date());
let tab='Inicio', shelfId='default', draft=null, cubeAngle=-22, filters={status:'Todos',query:''};
let data={
  profile:{name:'Valeria',theme:'classic'},
  theme:'classic',
  goal:20,
  books:[],
  sessions:[],
  shelves:[{id:'default',name:'Arcane Reads',rows:3,theme:'celestial',background:'',decor:'candle'}],
  settings:{customUi:true,readingReminder:'19:30'}
};

const STATUS = ['Todos','Por leer','Leyendo','Leído','Abandonado'];
const BOOK_SHELF_MAP = {'to-read':'Por leer','currently-reading':'Leyendo','read':'Leído'};

function openDB(){return new Promise((res,rej)=>{const req=indexedDB.open('ArcaneReadsV2',1);req.onupgradeneeded=()=>req.result.createObjectStore('state');req.onsuccess=()=>{db=req.result;res()};req.onerror=()=>rej(req.error)})}
function load(){return new Promise(resolve=>{const q=db.transaction('state').objectStore('state').get('app');q.onsuccess=()=>{if(q.result) data=q.result;resolve()};q.onerror=()=>resolve()})}
function save(){return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(data,'app');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
function rerender(){render();save().catch(console.error)}
function activeShelf(){return data.shelves.find(s=>s.id===shelfId)||data.shelves[0]}
function getBook(id){return data.books.find(b=>b.id===id)}
function readingBooks(){return data.books.filter(b=>b.status==='Leyendo')}
function doneBooks(){return data.books.filter(b=>b.status==='Leído')}
function unreadBooks(){return data.books.filter(b=>b.status==='Por leer')}
function totalPagesRead(){return data.sessions.reduce((a,s)=>a+(+s.pages||0),0)}
function totalMinutes(){return data.sessions.reduce((a,s)=>a+(+s.minutes||0),0)}
function readDaysThisMonth(){const month=today().slice(0,7);return new Set(data.sessions.filter(s=>s.date.startsWith(month)).map(s=>s.date)).size}
function streakDays(){
  const dates=[...new Set(data.sessions.map(s=>s.date))].sort(); if(!dates.length) return 0;
  let streak=0; let cursor=new Date();
  for(;;){ const d=cursor.toISOString().slice(0,10); if(dates.includes(d)){ streak++; cursor.setDate(cursor.getDate()-1); } else { if(streak===0) cursor.setDate(cursor.getDate()-1); else break; if(!dates.includes(cursor.toISOString().slice(0,10))) break; }}
  return streak;
}
function setTab(next){tab=next;render()}

function coverHtml(book, cls=''){return book.cover?`<img class="${cls}" src="${book.cover}" alt="">`:`<div class="${cls}" style="display:grid;place-items:center;color:#674e45;font-family:var(--font-title);height:100%">✦<br>${esc(book.title||'Libro')}</div>`}
function spineLabel(book){return esc(book.shortSpine || book.title || 'Libro')}
function displayAsset(book){if(book.display==='Portada') return book.cover; if(book.display==='Canto') return book.edge; if(book.display==='Apilado') return book.cover || book.spine; return book.spine;}

function render(){
  renderTopbar(); renderNav(); $('main').innerHTML='';
  const main=$('main');
  if(tab==='Inicio') main.appendChild(renderHome());
  if(tab==='Libros') main.appendChild(renderBooks());
  if(tab==='Biblioteca') main.appendChild(renderLibrary());
  if(tab==='Estadísticas') main.appendChild(renderStats());
  if(tab==='Perfil') main.appendChild(renderProfile());
}

function renderTopbar(){
  const top=$('topbar');
  top.className='topbar';
  top.innerHTML=`<div class="brand"><div class="brand-badge">A</div><div><div class="eyebrow">Buenas noches</div><h1>Arcane Reads</h1></div></div><button class="mini-btn" onclick="openQuickActions()">✦ Acciones</button>`;
}
function renderNav(){
  const icons={'Inicio':'⌂','Libros':'☷','Biblioteca':'📖','Estadísticas':'▮','Perfil':'◉'};
  $('nav').innerHTML=['Inicio','Libros','Biblioteca','Estadísticas','Perfil'].map(name=>`<button class="${tab===name?'active':''}" onclick="setTab('${name}')"><span>${icons[name]}</span><span>${name}</span></button>`).join('');
}

function renderHome(){
  const wrap=document.createElement('div');
  wrap.className='section-gap';
  const current=readingBooks()[0];
  wrap.innerHTML=`
    <section class="card hero">
      <div class="hero-book">${current?.cover?`<img src="${current.cover}" alt="">`:'📖'}</div>
      <div class="hero-copy">
        <div class="eyebrow">Tu próximo capítulo</div>
        <h2>${current?esc(current.title):'¿Qué estás leyendo?'}</h2>
        <p>${current?`${esc(current.author||'')} · Página ${current.current||0} de ${current.pages||'—'}`:'Elige un libro de tu biblioteca para iniciar una sesión de lectura pausada.'}</p>
      </div>
      <div class="hero-actions">
        <button class="btn" onclick="${current?`openReadingSession('${current.id}')`:'openAddBookFlow()'}">${current?'Empezar sesión':'Elige un libro'}</button>
        <button class="btn-ghost" onclick="openQuickPick()">Elige tu próximo libro</button>
      </div>
    </section>
    <section class="banner"><div><strong>Arcane Library</strong><div class="small">Tu biblioteca personalizada</div></div><button class="mini-btn" onclick="setTab('Biblioteca')">Ver estantería</button></section>
    <section class="card">
      <div class="label-row"><h2>Tu biblioteca</h2><button class="link-btn" onclick="setTab('Biblioteca')">Abrir</button></div>
      ${renderShelfPreview(activeShelf())}
    </section>
    <section class="grid-2">
      <div class="card"><div class="label-row"><div><div class="small muted">Tu meta ${new Date().getFullYear()}</div><h3>${doneBooks().length}/${data.goal}</h3></div><div class="pill">${Math.round((doneBooks().length/Math.max(data.goal,1))*100)||0}%</div></div><progress max="${Math.max(data.goal,1)}" value="${doneBooks().length}" style="width:100%"></progress></div>
      <div class="card"><div class="small muted">Racha actual</div><h3>${streakDays()} días</h3><p class="small">Días leídos este mes: ${readDaysThisMonth()}</p></div>
    </section>
    <section class="card"><div class="label-row"><h2>Acceso rápido</h2></div><div class="tabs"><button class="chip" onclick="openAddBookFlow()">Añadir libro</button><button class="chip" onclick="$('importer').click()">Importar Goodreads</button><button class="chip" onclick="setTab('Estadísticas')">Ver estadísticas</button><button class="chip" onclick="backup()">Exportar copia</button></div></section>
  `;
  return wrap;
}

function renderBooks(){
  const wrap=document.createElement('div');
  const list=filteredBooks();
  wrap.className='section-gap';
  wrap.innerHTML=`
    <section>
      <div class="label-row"><div><h2>Tus libros</h2><div class="muted small">Busca, organiza y edita tus ejemplares</div></div><button class="mini-btn" onclick="openAddBookFlow()">+ Añadir</button></div>
      <div class="tabs">${STATUS.map(s=>`<button class="chip ${filters.status===s?'active':''}" onclick="filters.status='${s}';render()">${s}</button>`).join('')}</div>
      <div class="card" style="padding:12px"><input placeholder="Buscar título, autor, saga o colección" value="${esc(filters.query)}" oninput="filters.query=this.value;render()"></div>
    </section>
    <section>${list.length?`<div class="book-grid">${list.map(b=>bookCard(b)).join('')}</div>`:`<div class="empty">Todavía no hay libros aquí.<br><br><button class="btn-soft" onclick="openAddBookFlow()">Añadir mi primer libro</button></div>`}</section>
  `;
  return wrap;
}
function filteredBooks(){return data.books.filter(b=> (filters.status==='Todos'||b.status===filters.status) && [b.title,b.author,b.saga,b.collection].join(' ').toLowerCase().includes(filters.query.toLowerCase()));}
function bookCard(book){return `<button class="book-card" onclick="editBook('${book.id}')"><div class="book-cover">${coverHtml(book)}</div><div class="book-title">${esc(book.title)}</div><div class="muted">${esc(book.author||'Sin autor')}</div><div class="small muted">${esc(book.status||'')}</div></button>`}

function renderLibrary(){
  const shelf=activeShelf();
  const wrap=document.createElement('div');
  wrap.className='section-gap';
  wrap.innerHTML=`
    <section>
      <div class="label-row"><div><h2>Tu biblioteca</h2><div class="muted small">${esc(shelf.name)}</div></div><div style="display:flex;gap:8px"><button class="mini-btn" onclick="shelfSettings()">Personalizar</button><button class="mini-btn" onclick="newShelf()">+ Biblioteca</button></div></div>
      <div class="card" style="padding:12px"><select onchange="shelfId=this.value;render()">${data.shelves.map(s=>`<option value="${s.id}" ${s.id===shelfId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
    </section>
    <section>${renderShelfPreview(shelf,true)}</section>
  `;
  return wrap;
}
function renderShelfPreview(shelf, large=false){
  const books=data.books.filter(b=>b.shelf===shelf.id);
  const bg=shelf.background?`background-image:url('${shelf.background}');background-size:cover;background-position:center;`:(shelf.theme==='cozy'?'background:linear-gradient(#ad8d78,#6d5345);':shelf.theme==='dark'?'background:linear-gradient(#32272d,#161118);':'background:var(--library-bg);');
  const rows=Array.from({length:shelf.rows},(_,i)=>books.filter(b=>(b.row||0)===i));
  return `<div class="shelf-shell"><div class="shelf-preview" style="${bg}${large?'min-height:560px':'min-height:250px'}">
    ${rows.map((rowBooks,i)=>`<div class="shelf-row">${rowBooks.map(shelfBookHtml).join('')}${!rowBooks.length?'<div style="opacity:.45;padding:12px 6px;font-style:italic">Repisa vacía</div>':''}</div>`).join('')}
  </div></div>`;
}
function shelfBookHtml(book){
  const display=book.display||'Lomo';
  const front=display==='Portada', edge=display==='Canto', stacked=display==='Apilado', src=displayAsset(book);
  const h=Math.min(150,Math.max(68,(book.height||22)*5.8));
  const w=Math.max(18,(front?(book.width||14):(book.thick||3))*5.7);
  if(stacked){
    const layers=Math.max(2,Math.min(6,book.stackCount||3));
    const stackWidth=Math.max(68,(book.width||14)*5.9);
    const layerHeight=Math.max(16,Math.min(24,(book.thick||3)*4.5));
    const layerSrc=book.stackFace==='Canto'?(book.edge||''):(book.cover||book.spine||'');
    return `<button class="shelf-book stack-book" onclick="editBook('${book.id}')" style="height:${layerHeight*layers+(layers-1)*5}px;width:${stackWidth}px;--stack-color:${book.stackFace==='Canto'?(book.edgeColor||'#e6dbc7'):(book.color||'#7b5d7b')}">${Array.from({length:layers},(_,i)=>`<div class="stack-layer" style="height:${layerHeight}px;transform:translateX(${Math.min(i*4,12)}px)">${layerSrc?`<img src="${layerSrc}" alt="">`:`<div class="stack-label">${esc(book.title||'Libro')}</div>`}</div>`).join('')}</button>`;
  }
  return `<button class="shelf-book" onclick="editBook('${book.id}')" style="height:${h}px;width:${w}px;background:${edge?(book.edgeColor||'#e6dbc7'):(book.color||'#7b5d7b')}">${src?`<img src="${src}" alt="">`:`<span>${spineLabel(book)}</span>`}</button>`;
}

function renderStats(){
  const wrap=document.createElement('div');
  const month=today().slice(0,7);
  const sessions=data.sessions.filter(s=>s.date.startsWith(month));
  const daysInMonth=new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
  const byDay=Object.fromEntries(sessions.map(s=>[s.date,s]));
  wrap.className='section-gap';
  wrap.innerHTML=`
    <section><h2>Tu lectura</h2><div class="muted small">${monthName()}</div></section>
    <section class="metric-grid">
      <div class="metric"><div class="n">${totalPagesRead()}</div><div class="muted small">Páginas</div></div>
      <div class="metric"><div class="n">${totalMinutes()}</div><div class="muted small">Minutos</div></div>
      <div class="metric"><div class="n">${doneBooks().length}</div><div class="muted small">Libros</div></div>
    </section>
    <section class="card"><div class="label-row"><div><h3>Resumen mensual</h3><div class="muted small">Racha ${streakDays()} días · ${readDaysThisMonth()} días leídos</div></div><button class="mini-btn" onclick="sessionDialog()">+ Sesión</button></div><div class="calendar">${Array.from({length:daysInMonth},(_,n)=>{const day=n+1; const d=`${month}-${String(day).padStart(2,'0')}`; const s=byDay[d]; return `<div class="day ${s?'read':''}">${s && getBook(s.bookId)?.cover?`<img src="${getBook(s.bookId).cover}" style="width:100%;height:100%;object-fit:cover">`:day}</div>`;}).join('')}</div></section>
    <section class="card"><h3>Sesiones recientes</h3>${data.sessions.length?`<div class="list">${data.sessions.slice().reverse().slice(0,6).map(s=>`<div class="list-item"><div class="thumb">${getBook(s.bookId)?.cover?`<img src="${getBook(s.bookId).cover}" alt="">`:'📖'}</div><div><strong>${esc(getBook(s.bookId)?.title||'Libro')}</strong><div class="muted small">${esc(s.date)} · ${s.pages} páginas · ${s.minutes} min</div></div></div>`).join('')}</div>`:'<div class="empty">Aún no hay sesiones de lectura este mes.</div>'}</section>
  `;
  return wrap;
}

function renderProfile(){
  const wrap=document.createElement('div');
  wrap.className='section-gap';
  wrap.innerHTML=`
    <section><h2>Perfil</h2><div class="muted small">Configura la estética y tus datos</div></section>
    <section class="card"><div class="label-row"><div><h3>${esc(data.profile.name||'Tu perfil')}</h3><div class="muted small">Tu rincón de lectura</div></div><div class="brand-badge" style="width:46px;height:46px;font-size:20px">A</div></div></section>
    <section class="card"><h3>App</h3>
      <div class="switch-row"><div><strong>Tema</strong><div class="muted small">Estilo global de la app</div></div><select style="width:auto" onchange="data.theme=this.value;rerender()"><option value="classic" ${data.theme==='classic'?'selected':''}>Clásico</option><option value="dark" ${data.theme==='dark'?'selected':''}>Dark</option><option value="cozy" ${data.theme==='cozy'?'selected':''}>Cozy</option><option value="celestial" ${data.theme==='celestial'?'selected':''}>Celestial</option></select></div>
      <div class="switch-row"><div><strong>Recordatorio de lectura</strong><div class="muted small">Solo referencia visual por ahora</div></div><input style="width:110px" value="${esc(data.settings.readingReminder||'19:30')}" onchange="data.settings.readingReminder=this.value;save()"></div>
      <div class="switch-row"><div><strong>Datos de la biblioteca</strong><div class="muted small">Importar o exportar</div></div><div style="display:flex;gap:8px"><button class="mini-btn" onclick="$('importer').click()">Importar</button><button class="mini-btn" onclick="backup()">Exportar</button></div></div>
    </section>
    <section class="card"><h3>Cómo agregar libros fácil</h3><div class="notice success">Te recomiendo usar <strong>Buscar en línea</strong> para traer título, autor, portada, descripción y páginas desde Google Books u Open Library. Para Goodreads, la vía fiable es <strong>importar tu CSV</strong>.</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn-soft" onclick="openAddBookFlow('search')">Buscar en línea</button><button class="mini-btn" onclick="$('importer').click()">Importar Goodreads</button><button class="mini-btn" onclick="editBook()">Añadir manual</button></div></section>
  `;
  applyTheme();
  return wrap;
}

function applyTheme(){
  const root=document.documentElement;
  const theme=data.theme;
  if(theme==='dark'){
    root.style.setProperty('--bg','#18151e'); root.style.setProperty('--panel','#241f2d'); root.style.setProperty('--card','#221d2a'); root.style.setProperty('--nav','#1d1824'); root.style.setProperty('--ink','#f4eae2'); root.style.setProperty('--muted','#bcaea7'); root.style.setProperty('--line','#3b3244'); root.style.setProperty('--accent','#a04c5e'); root.style.setProperty('--accent-soft','#35242a');
  } else if(theme==='cozy'){
    root.style.setProperty('--bg','#f9eee7'); root.style.setProperty('--panel','#fff8f1'); root.style.setProperty('--card','#fff8f1'); root.style.setProperty('--nav','#f8ebdf'); root.style.setProperty('--ink','#523936'); root.style.setProperty('--muted','#91746b'); root.style.setProperty('--line','#ead8ca'); root.style.setProperty('--accent','#ab5d63'); root.style.setProperty('--accent-soft','#f3dfe0');
  } else if(theme==='celestial'){
    root.style.setProperty('--bg','#11192f'); root.style.setProperty('--panel','#1d2844'); root.style.setProperty('--card','#1e2b4b'); root.style.setProperty('--nav','#16203a'); root.style.setProperty('--ink','#f5ecdf'); root.style.setProperty('--muted','#b8bed4'); root.style.setProperty('--line','#2f3e62'); root.style.setProperty('--accent','#bd8ed3'); root.style.setProperty('--accent-soft','#2c3553');
  } else {
    root.style.cssText='';
  }
}

function showSheet(html){ const dlg=$('dlg'); dlg.innerHTML=`<div class="sheet">${html}</div>`; if(!dlg.open) dlg.showModal(); }
function closeSheet(){ $('dlg').close(); }

function openQuickActions(){
  showSheet(`
    <div class="sheet-header"><div><h2>Acciones rápidas</h2><div class="muted small">Elige qué quieres hacer</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>
    <div class="list">
      <button class="card" onclick="closeSheet();openAddBookFlow('search')" style="text-align:left"><strong>Buscar en línea</strong><div class="muted small">Traer título, autor, portada y descripción</div></button>
      <button class="card" onclick="closeSheet();$('importer').click()" style="text-align:left"><strong>Importar Goodreads</strong><div class="muted small">Sube tu CSV exportado desde Goodreads</div></button>
      <button class="card" onclick="closeSheet();editBook()" style="text-align:left"><strong>Añadir manualmente</strong><div class="muted small">Para ediciones especiales o libros sin ficha online</div></button>
      <button class="card" onclick="closeSheet();sessionDialog()" style="text-align:left"><strong>Registrar sesión</strong><div class="muted small">Anota minutos y páginas leídas</div></button>
    </div>
  `)
}
function openQuickPick(){
  const pending=unreadBooks(); if(!pending.length) return openAddBookFlow();
  const pick=pending[Math.floor(Math.random()*pending.length)];
  showSheet(`<div class="sheet-header"><div><h2>Tu próxima lectura</h2><div class="muted small">Elegida al azar</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div><div class="card"><div class="list-item"><div class="thumb">${pick.cover?`<img src="${pick.cover}">`:'📖'}</div><div><strong>${esc(pick.title)}</strong><div class="muted small">${esc(pick.author||'')}</div><button class="btn-soft" style="margin-top:12px" onclick="closeSheet();editBook('${pick.id}')">Ver libro</button></div></div></div>`)
}

function openAddBookFlow(mode='menu'){
  if(mode==='search') return openSearchSheet();
  showSheet(`
    <div class="sheet-header"><div><h2>Añadir libro</h2><div class="muted small">Encuentra tu edición favorita</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>
    <div class="list">
      <button class="card" onclick="openSearchSheet()" style="text-align:left"><strong>✦ Buscar en Goodreads</strong><div class="muted small">Encuentra el libro y sus ediciones en el catálogo de Goodreads.</div></button>
      <button class="card" onclick="openSearchSheet('google')" style="text-align:left"><strong>Buscar por título o ISBN</strong><div class="muted small">Trae portada, autor, páginas y descripción desde Google Books u Open Library.</div></button>
      <button class="card" onclick="closeSheet();$('importer').click()" style="text-align:left"><strong>Importar mi biblioteca de Goodreads</strong><div class="muted small">Importación de un CSV exportado de tu cuenta.</div></button>
      <button class="card" onclick="editBook()" style="text-align:left"><strong>Añadir manualmente</strong><div class="muted small">Personaliza cada cara y las medidas de tu ejemplar.</div></button>
    </div>
  `);
}
let searchResultsCache=[];
function openSearchSheet(source='goodreads'){
  showSheet(`
    <div class="sheet-header"><div><h2>Encuentra tu libro</h2><div class="muted small">Busca una obra o una edición concreta</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>
    <div class="field"><label for="bookSearchInput">Título, autor o ISBN</label><div style="display:flex;gap:8px;align-items:center"><input id="bookSearchInput" placeholder="Alas de sangre, Rebecca Yarros…" onkeydown="if(event.key==='Enter'){event.preventDefault();runBookSearch()}"><button class="btn-soft" onclick="runBookSearch()">Buscar</button></div></div>
    <div class="segmented" style="margin-top:14px"><button id="segGR">Goodreads</button><button id="segGoogle">Google Books</button><button id="segOL">Open Library</button></div>
    <div id="searchStatus" class="muted small" style="margin-top:12px"></div>
    <div id="grHelp" style="margin-top:14px;display:none"><div class="notice"><strong>Encuentra la edición exacta.</strong> Busca en Goodreads, abre la ficha de tu edición y copia su ISBN. Regresa aquí y pega el ISBN para buscar sus datos en los catálogos disponibles. Goodreads se abre en otra pestaña; no existe acceso oficial público al catálogo para copiar sus fichas directamente.</div><div class="field" style="margin-top:14px"><label for="grIsbn">ISBN de la edición (10 o 13 caracteres)</label><input id="grIsbn" placeholder="978…" inputmode="text"><label for="grUrl">Enlace de Goodreads (opcional)</label><input id="grUrl" type="url" placeholder="https://www.goodreads.com/book/show/…"><button class="btn-soft" onclick="lookupGoodreadsEdition()">Traer ficha por ISBN</button><button class="mini-btn" onclick="manualGoodreadsEdition()">Crear ficha manual con enlace</button></div></div>
    <div id="searchResults" class="search-results"></div>
  `);
  window.searchSource=source;window.pendingGoodreadsUrl='';
  const select=(src)=>{window.searchSource=src; for(const [id,key] of [['segGR','goodreads'],['segGoogle','google'],['segOL','openlibrary']]) $(id).classList.toggle('active',src===key); $('grHelp').style.display=src==='goodreads'?'block':'none'; $('searchStatus').textContent=src==='goodreads'?'Goodreads · búsqueda en su sitio oficial':'Los resultados muestran fichas de la fuente seleccionada.'; $('searchResults').innerHTML='';};
  $('segGR').onclick=()=>select('goodreads'); $('segGoogle').onclick=()=>select('google'); $('segOL').onclick=()=>select('openlibrary');select(source);
}
function validGoodreadsUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&['goodreads.com','www.goodreads.com'].includes(u.hostname)&&u.pathname.startsWith('/book/show/')?u.href:'';}catch{return '';}}
function lookupGoodreadsEdition(){const isbn=$('grIsbn').value.replace(/[^0-9X]/gi,''); if(!/^(?:\d{13}|\d{9}[0-9X])$/i.test(isbn)){ $('searchStatus').textContent='Escribe un ISBN válido de 10 o 13 caracteres.';return;} const raw=$('grUrl').value.trim();window.pendingGoodreadsUrl=validGoodreadsUrl(raw);if(raw&&!window.pendingGoodreadsUrl){$('searchStatus').textContent='El enlace debe ser una ficha de libro de Goodreads.';return;} $('bookSearchInput').value=isbn;runBookSearch(true);}
function manualGoodreadsEdition(){const raw=$('grUrl').value.trim(),url=validGoodreadsUrl(raw),isbn=$('grIsbn').value.replace(/[^0-9X]/gi,'');if(raw&&!url){$('searchStatus').textContent='El enlace debe ser una ficha de libro de Goodreads.';return;} editBook();draft.goodreadsUrl=url;draft.isbn=isbn;const e=$('grBookUrl');if(e)e.value=url;const f=$('bookISBN');if(f)f.value=isbn;}
async function runBookSearch(forceIsbn=false){
  const input=$('bookSearchInput'), q=input.value.trim(); if(!q) return;
  if(window.searchSource==='goodreads'&&!forceIsbn){window.open('https://www.goodreads.com/search?q='+encodeURIComponent(q),'_blank','noopener,noreferrer'); $('searchStatus').textContent='Goodreads se abrió en otra pestaña. Vuelve con el ISBN de tu edición.';return;}
  const status=$('searchStatus'), resultsEl=$('searchResults');status.textContent='Buscando…';resultsEl.innerHTML='';
  try{
    let results=[];
    if(forceIsbn){let errs=0;try{results=await searchGoogleBooks('isbn:'+q)}catch{errs++}if(!results.length){try{results=await searchOpenLibrary('isbn:'+q)}catch{errs++}}if(!results.length&&errs===2)throw new Error('No se pudo consultar los catálogos. Intenta nuevamente.');}
    else if(window.searchSource==='openlibrary') results=await searchOpenLibrary(q);
    else {try{results=await searchGoogleBooks(q);}catch{results=await searchOpenLibrary(q);}if(!results.length)results=await searchOpenLibrary(q);}
    if(!status.isConnected)return;
    searchResultsCache=results;
    status.textContent=results.length?`${results.length} resultado(s) · elige tu edición`:'No encontré resultados. Puedes añadir el libro manualmente.';
    resultsEl.innerHTML=results.map((r,i)=>`<div class="search-card"><div class="thumb">${r.cover?`<img src="${esc(r.cover)}" alt="">`:'📖'}</div><div style="flex:1;min-width:0"><strong>${esc(r.title)}</strong><div class="muted small">${esc(r.author||'Sin autor')} ${r.pages?'· '+r.pages+' páginas':''}</div><div class="small muted">${esc(r.publisher||'')} ${esc(String(r.published||''))} ${r.isbn?'· ISBN '+esc(r.isbn):''}</div><div class="small" style="margin-top:6px">${esc(String(r.description||'').slice(0,180))}${String(r.description||'').length>180?'…':''}</div><div class="tiny muted" style="margin-top:6px">Fuente: ${r.source==='google'?'Google Books':'Open Library'}</div><button class="btn-soft" onclick="importSearchResult(searchResultsCache,${i})">Agregar a mi biblioteca</button></div></div>`).join('');
  }catch(err){if(status.isConnected)status.textContent='No se pudo buscar: '+err.message;}
}

async function searchGoogleBooks(query){
  const url=`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=12&printType=books`;
  const res=await fetch(url); if(!res.ok) throw new Error('falló Google Books');
  const json=await res.json();
  return (json.items||[]).map(item=>{ const v=item.volumeInfo||{}; return {
    source:'google',
    extId:item.id,
    title:v.title||'',
    author:(v.authors||[]).join(', '),
    description:stripHtml(v.description||''),
    pages:v.pageCount||0,
    isbn:(v.industryIdentifiers||[]).map(x=>x.identifier).find(Boolean)||'',
    cover:normalizeCover(v.imageLinks?.thumbnail||v.imageLinks?.smallThumbnail||''),
    published:v.publishedDate||'',
    publisher:v.publisher||'',
    categories:(v.categories||[]).join(', ')
  }});
}
async function searchOpenLibrary(query){
  const url=query.startsWith('isbn:')?`https://openlibrary.org/search.json?isbn=${encodeURIComponent(query.slice(5))}&limit=12`:`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`;
  const res=await fetch(url); if(!res.ok) throw new Error('falló Open Library');
  const json=await res.json();
  return (json.docs||[]).map(d=>({
    source:'openlibrary',
    extId:d.key,
    title:d.title||'',
    author:(d.author_name||[]).join(', '),
    description:Array.isArray(d.first_sentence)?String(d.first_sentence[0]||''):typeof d.first_sentence==='string'?d.first_sentence:'',
    pages:d.number_of_pages_median || 0,
    isbn:(d.isbn||[])[0] || '',
    cover:d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '',
    published:d.first_publish_year||'',
    publisher:(d.publisher||[])[0] || '',
    categories:(d.subject||[]).slice(0,5).join(', ')
  }));
}
function normalizeCover(url){return url ? url.replace('http://','https://') : ''}
function stripHtml(html){const div=document.createElement('div'); div.innerHTML=html; return div.textContent || div.innerText || '';}
function importSearchResult(results, index){
  const r = results[index];
  const book={id:uid(), title:r.title, author:r.author, isbn:r.isbn||'', pages:r.pages||0, current:0, status:'Por leer', description:r.description||'', publisher:r.publisher||'', year:String(r.published||''), categories:r.categories||'', height:22,width:14,thick:3,color:'#7b5472',edgeColor:'#e6dbc7',display:'Lomo',shelf:activeShelf().id,row:0,format:'Tapa blanda',rating:0,notes:'',saga:'',collection:'', cover:r.cover||'', source:r.source, sourceId:r.extId, goodreadsUrl:window.pendingGoodreadsUrl||'', stackCount:3, stackFace:'Portada'};
  if(data.books.some(b => (book.isbn && b.isbn===book.isbn) || (!book.isbn && b.source===book.source && b.sourceId===book.sourceId)) && !confirm('Ya tienes una ficha de esta edición. ¿Añadir otro ejemplar?')) return;
  data.books.push(book); closeSheet(); rerender(); setTimeout(()=>editBook(book.id),120);
}

function editBook(id){
  const base={id:uid(), title:'', author:'', isbn:'', pages:0, current:0, status:'Por leer', description:'', publisher:'', year:'', categories:'', height:22,width:14,thick:3,color:'#7b5472',edgeColor:'#e6dbc7',display:'Lomo',shelf:activeShelf().id,row:0,format:'Tapa blanda',rating:0,notes:'',saga:'',collection:'', cover:'',spine:'',edge:'',back:'',top:'',bottom:'',stackCount:3,stackFace:'Portada'};
  draft=structuredClone(id?getBook(id):base); cubeAngle=-20;
  showSheet(`
    <div class="sheet-header"><div><h2>${id?'Editar libro':'Nuevo libro'}</h2><div class="muted small">Personaliza el ejemplar físico</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>
    <div class="preview" id="preview"><div class="cube" id="cube"></div></div>
    <div class="tabs" style="margin:12px 0 0"><button class="chip" onclick="cubeAngle=0;drawCube()">Portada</button><button class="chip" onclick="cubeAngle=90;drawCube()">Lomo</button><button class="chip" onclick="cubeAngle=-90;drawCube()">Canto</button><button class="chip" onclick="cubeAngle=180;drawCube()">Contraportada</button></div>
    <div class="field" style="margin-top:14px">
      <label>Título</label><input value="${esc(draft.title)}" oninput="draft.title=this.value;drawCube()">
      <label>Autor</label><input value="${esc(draft.author)}" oninput="draft.author=this.value">
      <label>Descripción</label><textarea oninput="draft.description=this.value">${esc(draft.description||'')}</textarea>
      <label>ISBN</label><input id="bookISBN" value="${esc(draft.isbn)}" oninput="draft.isbn=this.value"><label>Enlace de Goodreads (opcional)</label><input id="grBookUrl" type="url" value="${esc(draft.goodreadsUrl||'')}" oninput="draft.goodreadsUrl=this.value" placeholder="https://www.goodreads.com/book/show/…">
      <div class="swatch-row">
        <div><label>Páginas</label><input type="number" min="0" value="${draft.pages||0}" oninput="draft.pages=+this.value"></div>
        <div><label>Página actual</label><input type="number" min="0" value="${draft.current||0}" oninput="draft.current=+this.value"></div>
      </div>
      <div class="swatch-row">
        <div><label>Altura (cm)</label><input type="number" step=".1" min="0.1" value="${draft.height||22}" oninput="draft.height=+this.value;drawCube()"></div>
        <div><label>Ancho (cm)</label><input type="number" step=".1" min="0.1" value="${draft.width||14}" oninput="draft.width=+this.value;drawCube()"></div>
      </div>
      <div class="swatch-row">
        <div><label>Grosor (cm)</label><input type="number" step=".1" min="0.1" value="${draft.thick||3}" oninput="draft.thick=+this.value;drawCube()"></div>
        <div><label>Valoración</label><input type="number" step=".5" min="0" max="5" value="${draft.rating||0}" oninput="draft.rating=+this.value"></div>
      </div>
      <label>Estado</label><select onchange="draft.status=this.value">${STATUS.filter(s=>s!=='Todos').map(s=>`<option ${draft.status===s?'selected':''}>${s}</option>`).join('')}</select>
      <label>Formato</label><select onchange="draft.format=this.value">${['Tapa blanda','Tapa dura','Digital','Audiolibro'].map(s=>`<option ${draft.format===s?'selected':''}>${s}</option>`).join('')}</select>
      <label>Mostrar en repisa</label><select onchange="draft.display=this.value;editBook(draft.id)">${['Lomo','Portada','Canto','Apilado'].map(s=>`<option ${draft.display===s?'selected':''}>${s}</option>`).join('')}</select>
      ${draft.display==='Apilado'?`<div class="swatch-row"><div><label>Cantidad apilada</label><input type="number" min="2" max="6" value="${draft.stackCount||3}" oninput="draft.stackCount=Math.max(2,Math.min(6,+this.value||3));drawCube()"></div><div><label>Vista de la pila</label><select onchange="draft.stackFace=this.value;drawCube()">${['Portada','Canto'].map(s=>`<option ${draft.stackFace===s?'selected':''}>${s}</option>`).join('')}</select></div></div>`:''}
      <label>Biblioteca</label><select onchange="draft.shelf=this.value">${data.shelves.map(s=>`<option value="${s.id}" ${draft.shelf===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
      <label>Repisa (1=superior)</label><input type="number" min="1" value="${(draft.row||0)+1}" oninput="draft.row=Math.max(0,+this.value-1)">
      <div class="swatch-row"><div><label>Color del lomo</label><input type="color" value="${draft.color||'#7b5472'}" oninput="draft.color=this.value;drawCube()"></div><div><label>Color del canto</label><input type="color" value="${draft.edgeColor||'#e6dbc7'}" oninput="draft.edgeColor=this.value;drawCube()"></div></div>
      <label>Saga</label><input value="${esc(draft.saga||'')}" oninput="draft.saga=this.value">
      <label>Colección</label><input value="${esc(draft.collection||'')}" oninput="draft.collection=this.value">
      <label>Notas / reseña</label><textarea oninput="draft.notes=this.value">${esc(draft.notes||'')}</textarea>
      <label>Portada</label><input type="file" accept="image/*" onchange="readImage(this.files[0]).then(x=>{draft.cover=x;drawCube()})">
      <label>Lomo</label><input type="file" accept="image/*" onchange="readImage(this.files[0]).then(x=>{draft.spine=x;drawCube()})">
      <label>Canto delantero</label><input type="file" accept="image/*" onchange="readImage(this.files[0]).then(x=>{draft.edge=x;drawCube()})">
      <label>Contraportada</label><input type="file" accept="image/*" onchange="readImage(this.files[0]).then(x=>{draft.back=x;drawCube()})">
      <label>Canto superior</label><input type="file" accept="image/*" onchange="readImage(this.files[0]).then(x=>{draft.top=x;drawCube()})">
      <label>Canto inferior</label><input type="file" accept="image/*" onchange="readImage(this.files[0]).then(x=>{draft.bottom=x;drawCube()})">
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn-soft" onclick="saveBook()">Guardar libro</button>${id?`<button class="mini-btn" onclick="deleteBook('${id}')">Eliminar</button>`:''}</div>
  `);
  drawCube();
  const prev=$('preview'); let dragging=false,lastX=0;
  prev.onpointerdown=e=>{dragging=true; lastX=e.clientX; prev.setPointerCapture(e.pointerId)};
  prev.onpointermove=e=>{if(dragging){cubeAngle += (e.clientX-lastX)*.8; lastX=e.clientX; drawCube();}};
  prev.onpointerup=()=>dragging=false; prev.onpointercancel=()=>dragging=false;
}
function drawCube(){
  const cube=$('cube'); if(!cube) return;
  if((draft.display||'')==='Apilado'){
    const layers=Math.max(2,Math.min(6,draft.stackCount||3));
    const width=Math.max(110,(draft.width||14)*9);
    const layerH=Math.max(18,Math.min(30,(draft.thick||3)*5));
    const faceSrc=draft.stackFace==='Canto' ? draft.edge : (draft.cover || draft.spine || '');
    cube.style.width=width+'px'; cube.style.height=(layers*layerH + (layers-1)*6)+'px'; cube.style.transform='rotateX(12deg) rotateY(-18deg)';
    cube.innerHTML=Array.from({length:layers},(_,i)=>`<div class="face" style="position:absolute;width:${width - i*8}px;height:${layerH}px;left:${i*4}px;top:${i*(layerH+6)}px;transform:none;background:${draft.stackFace==='Canto'?(draft.edgeColor||'#e6dbc7'):(draft.color||'#7e5974')}">${faceSrc?`<img src="${faceSrc}" alt="">`:`<span style="font-size:12px;color:#fff">${esc(draft.title||'Libro')}</span>`}</div>`).join('');
    return;
  }
  const h=Math.min(220, Math.max(72, (draft.height||22)*8));
  const w=h*Math.max(.28, Math.min(1.2, (draft.width||14)/(draft.height||22)));
  const d=Math.max(10, Math.min(90, h*(draft.thick||3)/(draft.height||22)));
  cube.style.width=w+'px'; cube.style.height=h+'px'; cube.style.transform=`rotateX(6deg) rotateY(${cubeAngle}deg)`;
  const face=(src, txt, cls, style, bg)=>`<div class="face ${cls||''}" style="${style};background:${bg||draft.color||'#7b5472'}">${src?`<img src="${src}" alt="">`:`<span>${esc(txt||'')}</span>`}</div>`;
  cube.innerHTML =
    face(draft.cover,draft.title,'',`width:${w}px;height:${h}px;transform:translateZ(${d/2}px)`) +
    face(draft.back,draft.author,'',`width:${w}px;height:${h}px;transform:rotateY(180deg) translateZ(${d/2}px)`) +
    face(draft.spine,draft.title,'spine',`width:${d}px;height:${h}px;left:${(w-d)/2}px;transform:rotateY(-90deg) translateZ(${w/2}px)`,draft.color) +
    face(draft.edge,'','',`width:${d}px;height:${h}px;left:${(w-d)/2}px;transform:rotateY(90deg) translateZ(${w/2}px)`,draft.edgeColor) +
    face(draft.top,'','',`width:${w}px;height:${d}px;top:${(h-d)/2}px;transform:rotateX(90deg) translateZ(${h/2}px)`,draft.edgeColor) +
    face(draft.bottom,'','',`width:${w}px;height:${d}px;top:${(h-d)/2}px;transform:rotateX(-90deg) translateZ(${h/2}px)`,draft.edgeColor);
}
function saveBook(){
  if(!draft.title.trim()) return alert('Ponle un título al libro.'); if(draft.goodreadsUrl && !validGoodreadsUrl(draft.goodreadsUrl)) return alert('Usa un enlace de una ficha de Goodreads.');
  if([draft.height,draft.width,draft.thick].some(v=>!Number.isFinite(v)||v<=0)) return alert('Las medidas deben ser positivas.');
  draft.pages=Math.max(0,Math.round(draft.pages||0)); draft.current=Math.min(draft.pages||Infinity, Math.max(0,Math.round(draft.current||0)));
  const shelf=data.shelves.find(s=>s.id===draft.shelf) || activeShelf(); draft.shelf=shelf.id; draft.row=Math.min(shelf.rows-1, Math.max(0,draft.row||0));
  const idx=data.books.findIndex(b=>b.id===draft.id);
  if(idx<0) data.books.push(draft); else data.books[idx]=draft;
  closeSheet(); rerender();
}
function deleteBook(id){ if(confirm('¿Eliminar este libro?')){ data.books=data.books.filter(b=>b.id!==id); closeSheet(); rerender(); } }

function sessionDialog(){
  if(!data.books.length) return openAddBookFlow();
  showSheet(`
    <div class="sheet-header"><div><h2>Registrar sesión</h2><div class="muted small">Páginas y tiempo de hoy</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>
    <div class="field">
      <label>Libro</label><select id="sessBook">${data.books.map(b=>`<option value="${b.id}">${esc(b.title)}</option>`).join('')}</select>
      <label>Fecha</label><input type="date" id="sessDate" value="${today()}">
      <div class="swatch-row"><div><label>Páginas leídas</label><input id="sessPages" type="number" min="0" value="0"></div><div><label>Minutos</label><input id="sessMins" type="number" min="0" value="0"></div></div>
    </div>
    <button class="btn-soft" style="margin-top:16px" onclick="saveSession()">Guardar sesión</button>
  `)
}
function openReadingSession(bookId){ sessionDialog(); setTimeout(()=>{ if($('sessBook')) $('sessBook').value=bookId; },60); }
function saveSession(){
  const b=getBook($('sessBook').value); const pages=Math.max(0,+$('sessPages').value||0); const mins=Math.max(0,+$('sessMins').value||0);
  data.sessions.push({id:uid(), bookId:b.id, date:$('sessDate').value, pages, minutes:mins});
  b.current=Math.min(b.pages||Infinity,(+b.current||0)+pages); if((b.pages||0) && b.current>=b.pages){ b.status='Leído'; } else if(pages>0 || mins>0){ b.status='Leyendo'; }
  closeSheet(); rerender();
}

function shelfSettings(){
  const s=activeShelf();
  showSheet(`
    <div class="sheet-header"><div><h2>Personalizar biblioteca</h2><div class="muted small">Fondo, nombre y repisas</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>
    <div class="field">
      <label>Nombre</label><input id="shelfName" value="${esc(s.name)}">
      <label>Estilo</label><select id="shelfTheme"><option value="celestial">Celestial</option><option value="dark">Dark academia</option><option value="cozy">Cozy</option></select>
      <label>Número de repisas</label><input id="shelfRows" type="number" min="1" max="8" value="${s.rows}">
      <label>Fondo propio</label><input type="file" accept="image/*" onchange="readImage(this.files[0]).then(x=>{window.__tempShelfBg=x;})">
    </div>
    <button class="btn-soft" style="margin-top:16px" onclick="saveShelfSettings()">Guardar cambios</button>
  `);
  $('shelfTheme').value=s.theme;
}
function saveShelfSettings(){
  const s=activeShelf(); s.name=$('shelfName').value.trim()||s.name; s.theme=$('shelfTheme').value; s.rows=Math.max(1,Math.min(8,+$('shelfRows').value||3)); if(window.__tempShelfBg) s.background=window.__tempShelfBg;
  data.books.filter(b=>b.shelf===s.id && (b.row||0)>=s.rows).forEach(b=>b.row=s.rows-1);
  window.__tempShelfBg=''; closeSheet(); rerender();
}
function newShelf(){ const name=prompt('Nombre de la nueva biblioteca'); if(!name?.trim()) return; const s={id:uid(),name:name.trim(),rows:3,theme:'celestial',background:''}; data.shelves.push(s); shelfId=s.id; rerender(); }

function backup(){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})); a.download='arcane-reads-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function readImage(file){return new Promise((resolve,reject)=>{if(!file) return resolve(''); const fr=new FileReader(); fr.onload=()=>{ const img=new Image(); img.onload=()=>{ const scale=Math.min(1, 1200/Math.max(img.width,img.height)); const c=document.createElement('canvas'); c.width=Math.max(1,img.width*scale); c.height=Math.max(1,img.height*scale); c.getContext('2d').drawImage(img,0,0,c.width,c.height); resolve(c.toDataURL('image/jpeg',0.88)); }; img.onerror=reject; img.src=fr.result; }; fr.onerror=reject; fr.readAsDataURL(file); })}
function parseCSV(text){let rows=[],row=[],cell='',q=false; for(let i=0;i<text.length;i++){ const ch=text[i]; if(ch==='"'){ if(q && text[i+1]==='"'){cell+='"'; i++;} else q=!q; } else if(ch===',' && !q){ row.push(cell); cell=''; } else if((ch==='\n' || ch==='\r') && !q){ if(ch==='\r' && text[i+1]==='\n') i++; row.push(cell); rows.push(row); row=[]; cell=''; } else cell+=ch; } if(cell||row.length){ row.push(cell); rows.push(row);} return rows; }
$('importer').onchange = async (e)=>{
  const f=e.target.files[0]; if(!f) return; try{
    const text=await f.text();
    if(f.name.toLowerCase().endsWith('.json')){
      const imported=JSON.parse(text); if(!Array.isArray(imported.books)||!Array.isArray(imported.shelves)||!Array.isArray(imported.sessions)) throw new Error('Copia inválida');
      if(confirm('¿Reemplazar tus datos actuales con esta copia?')){ data=imported; shelfId=data.shelves[0]?.id||'default'; rerender(); }
    } else {
      const [head,...rows]=parseCSV(text.replace(/^\uFEFF/,'')); const ix=k=>head.indexOf(k); const val=(r,k)=>r[ix(k)]||''; if(ix('Title')<0) throw new Error('No encuentro la columna Title del CSV de Goodreads');
      let count=0;
      for(const r of rows){
        const title=val(r,'Title').trim(), author=val(r,'Author').trim(), gid=val(r,'Book Id').trim();
        if(!title) continue;
        const isbn=(val(r,'ISBN13')||val(r,'ISBN')).replace(/[^0-9X]/gi,'');
        const exists=data.books.some(b=>(gid && b.goodreadsId===gid) || (isbn && b.isbn===isbn) || (b.title===title && b.author===author));
        if(exists) continue;
        data.books.push({id:uid(),goodreadsId:gid,title,author,isbn,pages:+val(r,'Number of Pages')||0,current:0,status:BOOK_SHELF_MAP[val(r,'Exclusive Shelf')]||'Por leer',rating:+val(r,'My Rating')||0,notes:val(r,'My Review'),description:'',publisher:'',year:'',categories:val(r,'Bookshelves'),height:22,width:14,thick:3,color:'#7b5472',edgeColor:'#e6dbc7',display:'Lomo',shelf:activeShelf().id,row:0,format:'Tapa blanda',cover:'',spine:'',edge:'',back:'',top:'',bottom:'',stackCount:3,stackFace:'Portada',saga:'',collection:val(r,'Bookshelves')});
        count++;
      }
      rerender(); alert(`Importados ${count} libros desde Goodreads. Ahora puedes completar sus portadas, lomos, cantos y medidas.`);
    }
  }catch(err){ alert('No se pudo importar: '+err.message); }
  e.target.value='';
};

if('serviceWorker' in navigator){ window.addEventListener('load', ()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{})); }
openDB().then(load).then(()=>{ applyTheme(); render(); }).catch(err=>{ console.error(err); alert('No pude abrir el almacenamiento local. Prueba en Chrome o Edge actualizados.'); });
