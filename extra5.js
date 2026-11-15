/* Arcane Reads v1.2 — sacar el libro de la repisa, fichas de detalle, sagas abribles */
const _sh3=showSheet;showSheet=function(h){$('dlg').classList.remove('detfull','pull');_sh3(h)};
/* (la animación del libro ahora está en extra10.js) */
/* ficha de detalles */
const splitList=v=>[...new Set(String(v||'').split(/[\/,;]/).map(s=>s.trim()).filter(Boolean))];
const tagsOf=b=>splitList(b.categories).filter(s=>s.length<40).slice(0,24);
const listOf=(b,k)=>k==='tags'?(Array.isArray(b.tags)?b.tags:[]):k==='categories'?splitList(b.categories):String(b[k]||'').split(',').map(s=>s.trim()).filter(Boolean);
const pubTxt=b=>{if(b.pubDate){const d=new Date(b.pubDate+'T12:00:00Z');if(!isNaN(d))return d.toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}return b.year||''};
const starsRO=n=>[1,2,3,4,5].map(i=>`<i class="${(n||0)>=i?'on':''}">★</i>`).join('');
bookDetails=function(id){const b=getBook(id);if(!b)return;const draw=()=>{
  const ss=data.sessions.filter(s=>s.bookId===id),pg=ss.reduce((a,s)=>a+(+s.pages||0),0),mn=ss.reduce((a,s)=>a+(+s.minutes||0),0),first=ss.map(s=>s.date).sort()[0],notes=(data.notes||[]).filter(n=>n.bookId===id),tg=tagsOf(b),cols=String(b.collection||'').split(',').map(s=>s.trim()).filter(Boolean);
  const tile=(l,v)=>v?`<div class="tl"><b>${esc(String(v))}</b><span>${l}</span></div>`:'';
  showSheet(`<div class="dt"><div class="dt-hero"><div class="dt-bg" style="${b.cover?`background-image:url(${b.cover})`:`background:${b.color||'#7b5472'}`}"></div><button class="vx dt-x" onclick="closeSheet()">×</button>
   <div class="dt-cov">${coverHtml(b)}</div><h2>${esc(b.title)}</h2><div class="dt-au">${esc(b.author||'Sin autor')}</div>
   <div class="dt-meta"><span class="dt-stars">${starsRO(b.rating)}</span><span class="stp">${esc(b.status||'Por leer')}</span>${b.format?`<span class="stp ghost">${esc(b.format)}</span>`:''}</div></div>
  <div class="dt-body">
   ${b.pages?`<div class="dt-card"><div class="label-row"><b>Progreso</b><span class="muted small">Página ${b.current||0} de ${b.pages} · ${pct(b)}%</span></div>${bar(pct(b))}</div>`:''}
   <div class="dt-stats">${tile('Páginas',b.pages)}${tile('Publicado',pubTxt(b))}${tile('Editorial',b.publisher)}${tile('Idioma',b.language)}${tile('ISBN',b.isbn)}${tile('ASIN',b.asin)}${b.grRating?tile((b.grRatings?Number(b.grRatings).toLocaleString('es')+' valoraciones':'Goodreads'),'★ '+Number(b.grRating).toFixed(2)):''}</div>
   ${(b.saga||cols.length)?`<h3>Saga y colección</h3><div class="tags">${b.saga?`<button class="tg saga-t" onclick="openGroup('saga',this.dataset.n)" data-n="${esc(b.saga)}">✦ ${esc(b.saga)}${b.sagaN?' · #'+esc(String(b.sagaN)):''}</button>`:''}${cols.map(t=>`<button class="tg col-t" onclick="openGroup('collection',this.dataset.n)" data-n="${esc(t)}">${esc(t)}</button>`).join('')}</div>`:''}
   ${tg.length?`<h3>Géneros</h3><div class="tags">${tg.map(t=>`<button class="tg" onclick="openGroup('categories',this.dataset.n)" data-n="${esc(t)}">${esc(t)}</button>`).join('')}</div>`:''}
   <h3>Etiquetas</h3><div class="tags">${(b.tags||[]).map(t=>`<button class="tg tag-u" onclick="openGroup('tags',this.dataset.n)" data-n="${esc(t)}">${esc(t)}</button>`).join('')}<button class="tg add-t" onclick="addTagTo('${id}')">+ Etiqueta</button></div>
   <h3>Sinopsis</h3>${b.description?`<p class="dtxt" style="white-space:pre-line">${esc(b.description)}</p><button class="link-btn" onclick="const p=this.previousElementSibling;p.classList.toggle('open');this.textContent=p.classList.contains('open')?'Leer menos':'Leer más'">Leer más</button>`:'<p class="muted" id="dwait">Buscando la sinopsis oficial…</p>'}
   ${ss.length?`<h3>Tu lectura</h3><div class="dt-stats">${tile('Sesiones',ss.length)}${tile('Páginas leídas',pg)}${tile('Minutos',mn)}${tile('Desde',first)}</div>`:''}
   ${b.notes?`<h3>Mi reseña</h3><p style="white-space:pre-line">${esc(b.notes)}</p>`:''}
   ${notes.length?`<h3>Notas y citas</h3>${notes.map(n=>`<div class="dt-note"><p class="hand">${esc(n.text)}</p><span class="muted small">${n.page?'pág. '+n.page+' · ':''}${n.date}</span></div>`).join('')}`:''}
   ${b.goodreadsUrl?`<a class="link-btn" href="${esc(b.goodreadsUrl)}" target="_blank" rel="noopener">Ver en Goodreads ↗</a>`:''}
  </div><div class="dt-bar"><button class="btn-soft" onclick="startSession('${id}')">${ic('hourglass')} Empezar sesión</button><button class="mini-btn" onclick="openBook('${id}')">${ic('mark')} Visor</button><button class="mini-btn" onclick="editBook('${id}')">${ic('quill')} Editar</button></div></div>`);
  $('dlg').classList.add('detfull')};
  draw();if(!b.description)enrich(b).then(()=>{if(b.description&&$('dwait'))draw();else if($('dwait'))$('dwait').textContent='No encontré sinopsis. Puedes escribirla en Editar.'})};
/* sagas y colecciones abribles */
function openGroup(kind,name){const l=data.books.filter(b=>listOf(b,kind).includes(name)),done=l.filter(b=>b.status==='Leído').length;
  showSheet(`<div class="sheet-header"><div><div class="eyebrow">${{saga:'Saga',tags:'Etiqueta',categories:'Género'}[kind]||'Colección'}</div><h2>${esc(name)}</h2><div class="muted small">${l.length} libro${l.length>1?'s':''} · ${done} leído${done===1?'':'s'}</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>${bar(l.length?Math.round(done/l.length*100):0)}
  <div class="gg">${l.map(b=>`<button class="hbook" onclick="bookDetails('${b.id}')"><div class="hcov">${coverHtml(b)}</div><b>${esc(b.title)}</b><span>${esc(b.status||'')}${b.status==='Leyendo'&&b.pages?' · '+pct(b)+'%':''}</span></button>`).join('')||'<div class="empty">Sin libros.</div>'}</div>`)}

function addTagTo(id){const b=getBook(id);if(!b)return;const t=(prompt('Nueva etiqueta')||'').replace(/,/g,' ').trim().slice(0,40);if(!t)return;b.tags=Array.isArray(b.tags)?b.tags:[];if(!b.tags.some(x=>x.toLowerCase()===t.toLowerCase()))b.tags.push(t);save();bookDetails(id)}
