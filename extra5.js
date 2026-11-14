/* Arcane Reads v1.2 — sacar el libro de la repisa, fichas de detalle, sagas abribles */
const _sh3=showSheet;showSheet=function(h){$('dlg').classList.remove('detfull','pull');_sh3(h)};
/* animación: el libro sale de la repisa y viaja al centro */
document.addEventListener('click',e=>{const el=e.target.closest('.shelf-book');if(el)window.__tap={r:el.getBoundingClientRect(),t:Date.now()}},true);
const _ob3=openBook;openBook=function(id){const tap=window.__tap&&Date.now()-window.__tap.t<600?window.__tap:null;window.__tap=null;_ob3(id);
  const b=getBook(id),c=$('cube'),st=document.querySelector('.edstage');if(!tap||!b||!c||!st||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  $('dlg').classList.add('pull');cubeAngle=b.display==='Portada'?0:b.display==='Canto'?-90:90;drawCube();
  const tr=c.getBoundingClientRect(),r=tap.r,s=Math.max(.12,Math.min(1,r.height/Math.max(1,tr.height))),tx=tr.left+tr.width/2,ty=tr.top+tr.height/2,dx=r.left+r.width/2-tx,dy=r.top+r.height/2-ty;
  st.style.transformOrigin=`${tx}px ${ty}px`;
  st.animate([{transform:`translate(${dx}px,${dy}px) scale(${s})`},{transform:`translate(${dx*.55}px,${dy*.55-22}px) scale(${s+(1-s)*.4})`,offset:.32},{transform:'none'}],{duration:780,easing:'cubic-bezier(.22,.8,.24,1)'});
  requestAnimationFrame(()=>{c.style.transition='transform .78s cubic-bezier(.22,.8,.24,1)';cubeAngle=-20;drawCube();setTimeout(()=>{c.style.transition=''},900)})};
/* ficha de detalles */
const tagsOf=b=>[...new Set(String(b.categories||'').split(/[\/,;]/).map(s=>s.trim()).filter(s=>s&&s.length<34))].slice(0,12);
const starsRO=n=>[1,2,3,4,5].map(i=>`<i class="${(n||0)>=i?'on':''}">★</i>`).join('');
bookDetails=function(id){const b=getBook(id);if(!b)return;const draw=()=>{
  const ss=data.sessions.filter(s=>s.bookId===id),pg=ss.reduce((a,s)=>a+(+s.pages||0),0),mn=ss.reduce((a,s)=>a+(+s.minutes||0),0),first=ss.map(s=>s.date).sort()[0],notes=(data.notes||[]).filter(n=>n.bookId===id),tg=tagsOf(b),cols=String(b.collection||'').split(',').map(s=>s.trim()).filter(Boolean);
  const tile=(l,v)=>v?`<div class="tl"><b>${esc(String(v))}</b><span>${l}</span></div>`:'';
  showSheet(`<div class="dt"><div class="dt-hero"><div class="dt-bg" style="${b.cover?`background-image:url(${b.cover})`:`background:${b.color||'#7b5472'}`}"></div><button class="vx dt-x" onclick="closeSheet()">×</button>
   <div class="dt-cov">${coverHtml(b)}</div><h2>${esc(b.title)}</h2><div class="dt-au">${esc(b.author||'Sin autor')}</div>
   <div class="dt-meta"><span class="dt-stars">${starsRO(b.rating)}</span><span class="stp">${esc(b.status||'Por leer')}</span>${b.format?`<span class="stp ghost">${esc(b.format)}</span>`:''}</div></div>
  <div class="dt-body">
   ${b.pages?`<div class="dt-card"><div class="label-row"><b>Progreso</b><span class="muted small">Página ${b.current||0} de ${b.pages} · ${pct(b)}%</span></div>${bar(pct(b))}</div>`:''}
   <div class="dt-stats">${tile('Páginas',b.pages)}${tile('Año',b.year)}${tile('Editorial',b.publisher)}${tile('ISBN',b.isbn)}</div>
   ${(tg.length||b.saga||cols.length)?`<h3>Géneros y etiquetas</h3><div class="tags">${b.saga?`<button class="tg saga-t" onclick="openGroup('saga',this.dataset.n)" data-n="${esc(b.saga)}">✦ ${esc(b.saga)}</button>`:''}${tg.map(t=>`<span class="tg">${esc(t)}</span>`).join('')}${cols.map(t=>`<button class="tg col-t" onclick="openGroup('collection',this.dataset.n)" data-n="${esc(t)}">${esc(t)}</button>`).join('')}</div>`:''}
   <h3>Sinopsis</h3>${b.description?`<p class="dtxt" style="white-space:pre-line">${esc(b.description)}</p><button class="link-btn" onclick="const p=this.previousElementSibling;p.classList.toggle('open');this.textContent=p.classList.contains('open')?'Leer menos':'Leer más'">Leer más</button>`:'<p class="muted" id="dwait">Buscando la sinopsis oficial…</p>'}
   ${ss.length?`<h3>Tu lectura</h3><div class="dt-stats">${tile('Sesiones',ss.length)}${tile('Páginas leídas',pg)}${tile('Minutos',mn)}${tile('Desde',first)}</div>`:''}
   ${b.notes?`<h3>Mi reseña</h3><p style="white-space:pre-line">${esc(b.notes)}</p>`:''}
   ${notes.length?`<h3>Notas y citas</h3>${notes.map(n=>`<div class="dt-note"><p class="hand">${esc(n.text)}</p><span class="muted small">${n.page?'pág. '+n.page+' · ':''}${n.date}</span></div>`).join('')}`:''}
   ${b.goodreadsUrl?`<a class="link-btn" href="${esc(b.goodreadsUrl)}" target="_blank" rel="noopener">Ver en Goodreads ↗</a>`:''}
  </div><div class="dt-bar"><button class="btn-soft" onclick="startSession('${id}')">${ic('hourglass')} Empezar sesión</button><button class="mini-btn" onclick="openBook('${id}')">${ic('mark')} Visor</button><button class="mini-btn" onclick="editBook('${id}')">${ic('quill')} Editar</button></div></div>`);
  $('dlg').classList.add('detfull')};
  draw();if(!b.description)enrich(b).then(()=>{if(b.description&&$('dwait'))draw();else if($('dwait'))$('dwait').textContent='No encontré sinopsis. Puedes escribirla en Editar.'})};
/* sagas y colecciones abribles */
function openGroup(kind,name){const l=data.books.filter(b=>String(b[kind]||'').split(',').map(s=>s.trim()).includes(name)),done=l.filter(b=>b.status==='Leído').length;
  showSheet(`<div class="sheet-header"><div><div class="eyebrow">${kind==='saga'?'Saga':'Colección'}</div><h2>${esc(name)}</h2><div class="muted small">${l.length} libro${l.length>1?'s':''} · ${done} leído${done===1?'':'s'}</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>${bar(l.length?Math.round(done/l.length*100):0)}
  <div class="gg">${l.map(b=>`<button class="hbook" onclick="bookDetails('${b.id}')"><div class="hcov">${coverHtml(b)}</div><b>${esc(b.title)}</b><span>${esc(b.status||'')}${b.status==='Leyendo'&&b.pages?' · '+pct(b)+'%':''}</span></button>`).join('')||'<div class="empty">Sin libros.</div>'}</div>`)}
