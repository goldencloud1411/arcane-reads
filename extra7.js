/* Arcane Reads v1.4 — ficha completa desde Goodreads (géneros, saga, ISBN, ASIN, idioma, fecha, valoración…) + etiquetas propias */
(function(){
const PXS=[x=>'https://api.allorigins.win/raw?url='+encodeURIComponent(x),x=>'https://corsproxy.io/?url='+encodeURIComponent(x),x=>'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(x)];
async function grHtml(u){
  for(const p of PXS){try{const c=new AbortController(),t=setTimeout(()=>c.abort(),15000);const r=await fetch(p(u),{signal:c.signal});clearTimeout(t);
    if(r.ok){const h=await r.text();if(h.length>3000&&/__NEXT_DATA__|ld\+json|goodreads/i.test(h))return h}}catch{}}
  return'';
}
const LANG={spanish:'Español',english:'Inglés',french:'Francés',german:'Alemán',italian:'Italiano',portuguese:'Portugués',japanese:'Japonés',catalan:'Catalán',chinese:'Chino',korean:'Coreano',russian:'Ruso'};
const lang=s=>{const f=String(s||'').split(/[;,]/)[0].trim();return LANG[f.toLowerCase()]||f};
const fmt=s=>{s=String(s||'').toLowerCase();return /audio/.test(s)?'Audiolibro':/kindle|ebook|e-book|digital/.test(s)?'Digital':/hard|tapa dura/.test(s)?'Tapa dura':/paper|mass|soft|trade|tapa blanda|board/.test(s)?'Tapa blanda':''};
const isoDate=ms=>{const d=new Date(+ms);return isNaN(d)||!ms?'':d.toISOString().slice(0,10)};
const clean=h=>stripHtml(String(h||'').replace(/<br\s*\/?>/gi,'\n')).replace(/\n{3,}/g,'\n\n').trim();

/* lee la ficha de Goodreads: apolloState (Next.js) → JSON-LD → HTML visible */
function parseGR(html,url){
  const doc=new DOMParser().parseFromString(html,'text/html'),g={genres:[]};
  let st=null;try{st=JSON.parse(doc.getElementById('__NEXT_DATA__').textContent).props.pageProps.apolloState}catch{}
  const R=x=>x&&x.__ref&&st?st[x.__ref]:x;
  if(st){
    let bk=null;const root=st.ROOT_QUERY||{};
    for(const k in root)if(/^getBookByLegacyId/.test(k)){bk=R(root[k]);break}
    if(!bk){const id=(String(url).match(/\/book\/show\/(\d+)/)||[])[1];for(const k in st){const o=st[k];if(o&&o.__typename==='Book'&&o.details&&(!id||String(o.legacyId)===id)){bk=o;break}}}
    if(bk){
      g.title=bk.title||bk.titleComplete||'';
      let d='';for(const f in bk)if(f.startsWith('description')&&typeof bk[f]==='string'&&bk[f].length>d.length)d=bk[f];g.description=clean(d);
      const dt=R(bk.details)||{};
      g.pages=+dt.numPages||0;g.publisher=dt.publisher||'';g.asin=dt.asin||'';g.isbn=dt.isbn13||dt.isbn||'';g.format=fmt(dt.format);
      g.language=lang(R(dt.language)?.name||dt.language);g.pubDate=isoDate(dt.publicationTime);g.year=g.pubDate.slice(0,4);
      g.cover=bk.imageUrl||'';g.url=bk.webUrl||'';
      g.genres=(bk.bookGenres||[]).map(x=>R(R(x)?.genre)?.name).filter(Boolean);
      const bs=(bk.bookSeries||[]).map(R)[0];if(bs){const se=R(bs.series);g.series=se?.title||'';g.seriesNum=bs.userPosition||''}
      const w=R(bk.work);const sx=R(w?.stats)||{};g.rating=+sx.averageRating||0;g.ratings=+sx.ratingsCount||0;g.reviews=+sx.textReviewsCount||0;
    }
  }
  try{const ld=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
    g.title=g.title||ld.name;g.pages=g.pages||+ld.numberOfPages||0;g.isbn=g.isbn||ld.isbn||'';g.format=g.format||fmt(ld.bookFormat);g.language=g.language||lang(ld.inLanguage);
    const ar=ld.aggregateRating||{};g.rating=g.rating||+ar.ratingValue||0;g.ratings=g.ratings||+ar.ratingCount||0;g.reviews=g.reviews||+ar.reviewCount||0;g.cover=g.cover||ld.image||''}catch{}
  if(!g.genres.length)g.genres=[...doc.querySelectorAll('[data-testid="genresList"] a, .BookPageMetadataSection__genreButton a')].map(a=>a.textContent.trim()).filter(Boolean);
  g.genres=[...new Set(g.genres)];
  if(!g.description){const d=doc.querySelector('[data-testid="description"]');g.description=d?d.textContent.trim():(doc.querySelector('meta[property="og:description"]')?.content||'')}
  if(!g.series){const a=doc.querySelector('a[href*="/series/"]');if(a){g.series=a.textContent.replace(/\s*#\s*[\d.]+\s*$/,'').replace(/\s*\(#?[\d.]+\)\s*$/,'').trim();const m=(a.parentElement?.textContent||a.textContent).match(/#\s*(\d+(?:\.\d+)?)/);g.seriesNum=m?m[1]:''}}
  if(!g.url){const u=doc.querySelector('meta[property="og:url"]')?.content||doc.querySelector('link[rel="canonical"]')?.href||'';g.url=u}
  g.url=validGoodreadsUrl(g.url)||'';
  const n=parseFloat(g.seriesNum);g.seriesNum=isFinite(n)&&n>0?n:'';
  return g;
}
const hasData=g=>g&&(g.genres.length||g.description||g.pages||g.isbn||g.series);

/* guarda en el libro (sin pisar lo que ya escribiste, salvo "Traer datos" manual = force) */
function apply(b,g,force){
  const put=(k,v)=>{if(v===undefined||v===null||v===''||v===0)return;if(force||!b[k])b[k]=v};
  ['description','pages','publisher','year','pubDate','isbn','asin','language','cover'].forEach(k=>put(k,g[k]));
  if(!b.goodreadsUrl||force)put('goodreadsUrl',g.url);
  if(g.format&&(force||!b.grDone))b.format=g.format;
  if(g.genres.length){const cur=force?[]:splitList(b.categories);b.categories=[...new Set([...cur,...g.genres])].join(', ')}
  put('saga',g.series);put('sagaN',g.seriesNum);
  if(g.rating){b.grRating=g.rating;b.grRatings=g.ratings;b.grReviews=g.reviews}
  b.grDone=Date.now();
}
async function findUrl(b,search){
  let u=b.goodreadsUrl&&validGoodreadsUrl(b.goodreadsUrl);if(u)return u;
  const isbn=String(b.isbn||'').replace(/[^0-9X]/gi,'');if(/^(\d{13}|\d{9}[0-9X])$/i.test(isbn))return'https://www.goodreads.com/book/isbn/'+isbn;
  if(search&&b.title){try{const r=await searchGoodreads((b.title+' '+(b.author||'')).trim());return r[0]?.goodreadsUrl||''}catch{}}
  return'';
}
window.syncGoodreads=async function(b,o={}){
  const url=await findUrl(b,o.search);b.grTried=Date.now();if(!url){save();return null}
  let g=null;try{g=parseGR(await grHtml(url),url)}catch{}
  if(!hasData(g)){save();return null}
  const d=(typeof draft!=='undefined'&&draft&&draft.id===b.id&&draft!==b)?draft:null;
  apply(b,g,!!o.force);if(d)apply(d,g,!!o.force);save();return g;
};

/* se ejecuta solo: libros nuevos y, en segundo plano, los que aún no tienen la ficha completa */
const _en=enrich;enrich=async function(b){if(b&&!b.grDone&&(b.goodreadsUrl||b.isbn))await syncGoodreads(b);return _en(b)};
const _is=importSearchResult;importSearchResult=function(r,i){const n=data.books.length;_is(r,i);const b=data.books[data.books.length-1];
  if(data.books.length>n&&b&&(b.goodreadsUrl||b.isbn)){toast('Trayendo datos de Goodreads…');syncGoodreads(b).then(g=>{if(!g)return toast('No pude leer Goodreads; usé los datos básicos');toast('Datos de Goodreads listos ✦');
    if(typeof draft!=='undefined'&&draft&&draft.id===b.id&&$('dlg').open){editBook(null,draft)}else rerender()})}};
let busy=false;async function grAll(){if(busy||!navigator.onLine)return;busy=true;let n=0;
  for(const b of data.books){if(b.grDone||(!b.goodreadsUrl&&!b.isbn)||(b.grTried&&Date.now()-b.grTried<6048e5))continue;if(++n>8)break;await syncGoodreads(b);await new Promise(r=>setTimeout(r,1500))}
  busy=false;if(n)rerender()}
setTimeout(grAll,7000);addEventListener('online',()=>setTimeout(grAll,2000));

/* búsqueda en "Libros" también por género, etiqueta, ISBN */
filteredBooks=function(){const q=filters.query.toLowerCase();return sortBooks(data.books.filter(b=>(filters.status==='Todos'||b.status===filters.status)&&[b.title,b.author,b.saga,b.collection,b.categories,(b.tags||[]).join(' '),b.isbn].join(' ').toLowerCase().includes(q)))};

/* editor: sincronizar, nº de saga, géneros y etiquetas editables */
const LIST={tags:()=>Array.isArray(draft.tags)?draft.tags:[],categories:()=>splitList(draft.categories)};
const SET={tags:a=>{draft.tags=a},categories:a=>{draft.categories=a.join(', ')}};
const norm=t=>String(t).replace(/,/g,' ').replace(/\s+/g,' ').trim().slice(0,40);
function sugg(f){if(f!=='tags')return[];const c=new Map();data.books.forEach(b=>(b.tags||[]).forEach(t=>c.set(t,(c.get(t)||0)+1)));
  const base=[...c.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);['Favorito','Releer','Prestado','Con anotaciones','Regalo'].forEach(t=>{if(!base.includes(t))base.push(t)});
  const cur=LIST.tags().map(x=>x.toLowerCase());return base.filter(t=>!cur.includes(t.toLowerCase())).slice(0,8)}
window.tgDraw=function(f,focus){const box=document.querySelector(`.tagbox[data-f="${f}"]`);if(!box||!draft)return;
  box.innerHTML=LIST[f]().map((t,i)=>`<span class="tgc">${esc(t)}<button type="button" aria-label="Quitar" onclick="tgDel('${f}',${i})">×</button></span>`).join('')+`<input class="tgin" data-f="${f}" placeholder="${LIST[f]().length?'+ añadir':'Escribe y pulsa Enter'}" enterkeyhint="done" onkeydown="tgKey(event,'${f}')" onblur="tgAdd('${f}',this.value,0)">`;
  const sg=document.getElementById('tgs-'+f);if(sg)sg.innerHTML=sugg(f).map(t=>`<button type="button" onclick="tgAdd('${f}',this.dataset.t,1)" data-t="${esc(t)}">+ ${esc(t)}</button>`).join('');
  if(focus){const i=box.querySelector('.tgin');i&&i.focus()}};
window.tgAdd=function(f,v,focus){const t=norm(v);if(!t)return;const a=LIST[f]();if(!a.some(x=>x.toLowerCase()===t.toLowerCase())){SET[f]([...a,t])}tgDraw(f,focus)};
window.tgDel=function(f,i){const a=LIST[f]();a.splice(i,1);SET[f](a);tgDraw(f,0)};
window.tgKey=function(e,f){if(e.key==='Enter'||e.key===','){e.preventDefault();const v=e.target.value;e.target.value='';tgAdd(f,v,1)}else if(e.key==='Backspace'&&!e.target.value){const a=LIST[f]();if(a.length){a.pop();SET[f](a);tgDraw(f,1)}}};
window.grSyncDraft=async function(){const m=$('grSyncMsg'),btn=$('grSyncBtn');if(!draft||!m)return;btn.disabled=true;m.textContent='Buscando en Goodreads…';
  const g=await syncGoodreads(draft,{force:true,search:true});btn.disabled=false;
  if(!g){m.textContent='No pude leer Goodreads ahora (puede que el servicio intermedio esté ocupado). Prueba otra vez en un rato o pega el enlace de la ficha.';return}
  toast('Datos de Goodreads listos ✦');editBook(null,draft);setTimeout(()=>edPanel('more'),60)};
function inject(){const sb=$('secBasic');if(!sb||sb.dataset.x7)return;sb.dataset.x7=1;
  const url=$('grBookUrl');if(url)url.insertAdjacentHTML('afterend',`<button type="button" class="mini-btn" id="grSyncBtn" style="margin-top:8px" onclick="grSyncDraft()">✦ Traer todos los datos de Goodreads</button><div class="muted small" id="grSyncMsg">${draft&&draft.grDone?'Última sincronización: '+new Date(draft.grDone).toLocaleDateString('es'):'Usa el ISBN o el enlace de la ficha.'}</div>`);
  const col=sb.querySelector('input[oninput*="draft.collection"]');
  const html=`<label>Nº en la saga</label><input type="number" min="0" step="0.5" value="${draft.sagaN||''}" oninput="draft.sagaN=+this.value||''" placeholder="1, 2, 3… (ordena la estantería)">
    <label>Géneros</label><div class="tagbox" data-f="categories"></div>
    <label>Etiquetas</label><div class="tagbox" data-f="tags"></div><div class="tgsug" id="tgs-tags"></div>`;
  if(col)col.insertAdjacentHTML('afterend',html);else sb.insertAdjacentHTML('beforeend',html);
  tgDraw('categories');tgDraw('tags')}
const _eb=editBook;editBook=function(id,o){_eb(id,o);inject()};
const _sv=saveBook;saveBook=function(){document.querySelectorAll('.tgin').forEach(i=>{if(i.value.trim())tgAdd(i.dataset.f,i.value,0)});_sv()};
})();
