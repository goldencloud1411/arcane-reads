/* Arcane Reads v1.4 — ficha completa desde Goodreads (géneros, saga, ISBN, ASIN, idioma, fecha, valoración…) + etiquetas propias */
(function(){
const PXS=[x=>'https://api.allorigins.win/raw?url='+encodeURIComponent(x),x=>'https://api.allorigins.win/get?url='+encodeURIComponent(x),x=>'https://corsproxy.io/?url='+encodeURIComponent(x),x=>'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(x),x=>'https://thingproxy.freeboard.io/fetch/'+x];
function grHtml(u,loose){
  const cs=[];
  const mk=p=>new Promise(async(res,rej)=>{try{const c=new AbortController(),tm=setTimeout(()=>c.abort(),8000);cs.push(c);const r=await fetch(p(u),{signal:c.signal});clearTimeout(tm);if(!r.ok)return rej();let h=await r.text();
    if(h[0]==='{'){try{h=JSON.parse(h).contents||''}catch{}}if(h.length>3000&&(loose||/__NEXT_DATA__|ld\+json/.test(h)))res(h);else rej()}catch{rej()}});
  return Promise.any(PXS.map(mk)).then(h=>{cs.forEach(c=>c.abort());return h}).catch(()=>'');
}
/* búsqueda de Goodreads (al agregar libros): todas las rutas a la vez y con tiempo límite (antes iba una por una y sin límite) */
searchGoodreads=async function(q){
  const u='https://www.goodreads.com/book/auto_complete?format=json&q='+encodeURIComponent(q),cs=[];
  const one=p=>new Promise(async(res,rej)=>{try{const c=new AbortController(),tm=setTimeout(()=>c.abort(),8000);cs.push(c);const r=await fetch(p(u),{signal:c.signal});clearTimeout(tm);if(!r.ok)return rej();let j=await r.json();
    if(!Array.isArray(j)&&j&&j.contents){try{j=JSON.parse(j.contents)}catch{}}if(Array.isArray(j)&&j.length)res(j);else rej()}catch{rej()}});
  let j;try{j=await Promise.any(PXS.map(one))}catch{throw new Error('Goodreads no disponible')}
  cs.forEach(c=>c.abort());
  return j.slice(0,12).map(b=>({source:'goodreads',extId:String(b.bookId),title:b.bookTitleBare||b.title||'',author:b.author?.name||'',pages:0,isbn:'',description:'',published:'',publisher:'',categories:'',cover:String(b.imageUrl||'').replace(/\._S[XY]\d+_/,'').replace('http://','https://'),goodreadsUrl:b.bookUrl?'https://www.goodreads.com'+b.bookUrl:''}));
};
const LANG={spanish:'Español',english:'Inglés',french:'Francés',german:'Alemán',italian:'Italiano',portuguese:'Portugués',japanese:'Japonés',catalan:'Catalán',chinese:'Chino',korean:'Coreano',russian:'Ruso'};
const lang=s=>{const f=String(s||'').split(/[;,]/)[0].trim();return LANG[f.toLowerCase()]||f};
const fmt=s=>{s=String(s||'').toLowerCase();return /audio/.test(s)?'Audiolibro':/kindle|ebook|e-book|digital/.test(s)?'Digital':/hard|tapa dura/.test(s)?'Tapa dura':/paper|mass|soft|trade|tapa blanda|board/.test(s)?'Tapa blanda':''};
const isoDate=ms=>{const d=new Date(+ms);return isNaN(d)||!ms?'':d.toISOString().slice(0,10)};
const clean=h=>stripHtml(String(h||'').replace(/<br\s*\/?>/gi,'\n')).replace(/\n{3,}/g,'\n\n').trim();

/* lee la ficha de Goodreads: apolloState (Next.js) → JSON-LD → HTML visible */
function parseDur(t){t=String(t||'');let m=t.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);if(m&&(m[1]||m[2]))return(+m[1]||0)*60+(+m[2]||0);
  m=t.match(/(\d+)\s*(?:hrs?|hours?|horas?|h)\b\.?(?:\s*(?:and|y|,)?\s*(\d+)\s*(?:mins?|minutes?|minutos?|m)\b)?/i);if(m)return(+m[1])*60+(+m[2]||0);
  m=t.match(/(\d+)\s*(?:mins?|minutes?|minutos?)\b/i);return m?+m[1]:0}
/* editor: solo se vuelve a dibujar si sigues en él, y conserva el panel y el scroll que tenías (no abre nada solo) */
function editorOpen(id){const d=$('dlg');return !!(d&&d.open&&d.classList.contains('edfull')&&$('secBasic')&&typeof draft!=='undefined'&&draft&&draft.id===id)}
function reopenEditor(){const was=typeof edCur!=='undefined'?edCur:'',em=$('edmore'),els=[em,em&&em.parentElement,document.querySelector('#dlg .sheet')].filter(Boolean),sc=els.map(e=>e.scrollTop);
  editBook(null,draft);const back=()=>{if(!editorOpen(draft.id))return;const n=[$('edmore'),$('edmore')&&$('edmore').parentElement,document.querySelector('#dlg .sheet')].filter(Boolean);n.forEach((e,i)=>{if(sc[i]!=null)e.scrollTop=sc[i]})};
  setTimeout(()=>{if(was&&editorOpen(draft.id))edPanel(was,1);back();setTimeout(back,120)},60)}
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
      const w=R(bk.work);g.workId=(w&&w.legacyId)||'';
      g.narrator=(bk.secondaryContributorEdges||[]).map(R).filter(e=>e&&/narrat/i.test(e.role||'')).map(e=>(R(e.node)||{}).name).filter(Boolean).join(', ');
      const sx=R(w?.stats)||{};g.rating=+sx.averageRating||0;g.ratings=+sx.ratingsCount||0;g.reviews=+sx.textReviewsCount||0;
    }
  }
  try{const ld=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
    g.title=g.title||ld.name;g.pages=g.pages||+ld.numberOfPages||0;g.isbn=g.isbn||ld.isbn||'';g.format=g.format||fmt(ld.bookFormat);g.language=g.language||lang(ld.inLanguage);
    const ar=ld.aggregateRating||{};g.rating=g.rating||+ar.ratingValue||0;g.ratings=g.ratings||+ar.ratingCount||0;g.reviews=g.reviews||+ar.reviewCount||0;g.cover=g.cover||ld.image||''}catch{}
  if(!g.genres.length)g.genres=[...doc.querySelectorAll('[data-testid="genresList"] a, .BookPageMetadataSection__genreButton a')].map(a=>a.textContent.trim()).filter(Boolean);
  g.genres=[...new Set(g.genres)];
  if(g.format==='Audiolibro'){const tx=[...doc.querySelectorAll('[data-testid="pagesFormat"],[data-testid="bookEdition"]')].map(x=>x.textContent).join(' | ');g.audioMins=parseDur(tx)||parseDur(doc.body?doc.body.textContent.match(/(?:Audible Audio|Audiobook)[^|]{0,120}/i)?.[0]:'')}
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
  put('saga',g.series);put('sagaN',g.seriesNum);put('audioMins',g.audioMins);put('narrator',g.narrator);
  if(g.rating){b.grRating=g.rating;b.grRatings=g.ratings;b.grReviews=g.reviews}
  b.grDone=Date.now();delete b.syncFail;
}
async function findUrl(b,search){
  let u=b.goodreadsUrl&&validGoodreadsUrl(b.goodreadsUrl);if(u)return u;
  const isbn=String(b.isbn||'').replace(/[^0-9X]/gi,'');if(/^(\d{13}|\d{9}[0-9X])$/i.test(isbn))return'https://www.goodreads.com/book/isbn/'+isbn;
  if(search&&b.title){try{const r=await searchGoodreads((b.title+' '+(b.author||'')).trim());return r[0]?.goodreadsUrl||''}catch{}}
  return'';
}
const L2={es:'Español',en:'Inglés',fr:'Francés',de:'Alemán',it:'Italiano',pt:'Portugués',ja:'Japonés',ca:'Catalán'};
/* ¿Este libro aún necesita datos? Cuenta como actualizado si ya tiene sinopsis, géneros y páginas
   (vengan de Goodreads, Google Books u Open Library) o si Goodreads ya lo sincronizó completo. */
window.needsSync=b=>!b.grDone&&(!b.description||!b.categories||!(b.pages||b.format==='Audiolibro'))&&!(b.syncFail&&Date.now()-b.syncFail<6048e5)&&!(b.syncOk&&Date.now()-b.syncOk<6048e5);
const tf=(u,ms=10000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(u,{signal:c.signal}).finally(()=>clearTimeout(t))};
const isbnOf=b=>String(b.isbn||'').replace(/[^0-9X]/gi,'');
const shortTitle=t=>String(t||'').replace(/\s*[:(\[–—-].*$/,'').trim()||String(t||'');
function gbToG(v){const pd=String(v.publishedDate||''),ids=v.industryIdentifiers||[];
  return{genres:[...new Set((v.categories||[]).flatMap(c=>c.split('/')).map(x=>x.trim()).filter(Boolean))],description:clean(v.description||''),pages:+v.pageCount||0,publisher:v.publisher||'',year:pd.slice(0,4),pubDate:/^\d{4}-\d{2}-\d{2}$/.test(pd)?pd:'',isbn:(ids.find(i=>i.type==='ISBN_13')||{}).identifier||'',language:L2[v.language]||v.language||'',series:'',seriesNum:'',rating:0}}
async function gbFallback(b){
  const isbn=isbnOf(b),t=shortTitle(b.title),au=String(b.author||'').split(',')[0].trim(),qs=[];
  if(isbn)qs.push('isbn:'+isbn);
  if(t){const t2=t.replace(/^(a|an|the|el|la|los|las)\s+/i,'').trim(),sn=au.split(' ').pop();qs.push(`intitle:${t}${au?' inauthor:'+au:''}`);qs.push(`${t} ${au}`.trim());qs.push(`intitle:"${t2}"`);if(sn)qs.push(`${t2} ${sn}`)}
  const rs=await Promise.all(qs.map(async qq=>{
    try{const j=await(await tf('https://www.googleapis.com/books/v1/volumes?maxResults=5&q='+encodeURIComponent(qq),7000)).json();
      const it=(j.items||[]).map(x=>x.volumeInfo).filter(Boolean);
      const v=it.find(x=>x.description&&x.categories)||it.find(x=>x.description)||it.find(x=>x.categories)||it[0];
      if(v){const g=gbToG(v);if(g.description||g.genres.length||g.pages)return g}}catch{}
    return null}));
  return rs.find(Boolean)||null;
}
async function olFallback(b){
  try{const isbn=isbnOf(b),t=shortTitle(b.title),au=String(b.author||'').split(',')[0].trim(),f='&fields=key,subject,number_of_pages_median,publisher,first_publish_year&limit=1';
    const u=isbn?`https://openlibrary.org/search.json?isbn=${isbn}${f}`:`https://openlibrary.org/search.json?title=${encodeURIComponent(t)}${au?'&author='+encodeURIComponent(au):''}${f}`;
    const d=((await(await tf(u)).json()).docs||[])[0];if(!d)return null;
    let desc='';if(d.key){try{const w=await(await tf('https://openlibrary.org'+d.key+'.json')).json(),x=w.description;desc=clean(typeof x==='string'?x:(x&&x.value)||'')}catch{}}
    return{genres:(d.subject||[]).filter(x=>x.length<30).slice(0,5),description:desc,pages:+d.number_of_pages_median||0,publisher:(d.publisher||[])[0]||'',year:String(d.first_publish_year||''),pubDate:'',isbn:'',language:'',series:'',seriesNum:'',rating:0}}catch{return null}
}
/* Google Books y, si falta algo, Open Library completa los huecos */
async function fallbackAll(b){
  const rs=await Promise.all([gbFallback(b),olFallback(b),ituFallback(b)].map(p=>p.catch(()=>null)));
  const g=rs.find(Boolean);if(!g)return null;
  for(const x of rs){if(!x||x===g)continue;for(const k of['description','pages','publisher','year']){if(!g[k]&&x[k])g[k]=x[k]}if(!(g.genres||[]).length&&(x.genres||[]).length)g.genres=x.genres}
  return g;
}
async function ituFallback(b){try{const t=shortTitle(b.title),au=String(b.author||'').split(',')[0].trim(),lw=x=>String(x||'').toLowerCase();const rs=await Promise.all(['es','us'].map(async c=>{try{const j=await(await tf(`https://itunes.apple.com/search?media=ebook&entity=ebook&limit=6&country=${c}&term=${encodeURIComponent((t+' '+au).trim())}`,7000)).json();const r=(j.results||[]).find(x=>lw(x.trackName).includes(lw(t).slice(0,18)));if(r)return{genres:(r.genres||[]).filter(x=>!/^(ebooks?|books?|libros)$/i.test(x)),description:clean(r.description||''),pages:0,publisher:'',year:String(r.releaseDate||'').slice(0,4),pubDate:'',isbn:'',language:'',series:'',seriesNum:'',rating:0}}catch{}return null}));return rs.find(Boolean)||null}catch{}return null}
window.syncGoodreads=async function(b,o={}){
  const fbP=fallbackAll(b).catch(()=>null);   /* en paralelo con Goodreads, no después */
  const grP=(async()=>{
    const url=await findUrl(b,o.search);b.grTried=Date.now();let g=null;
    if(url){try{g=parseGR(await grHtml(url),url)}catch{}}
    if(g&&!g.audioMins&&g.workId&&(b.format==='Audiolibro'||g.format==='Audiolibro')){try{const h=await grHtml('https://www.goodreads.com/work/editions/'+g.workId+'?filter_by_format=Audiobook',true),tx=h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' '),i=tx.search(/Audible Audio|Audiobook|Audio CD|Audio Download/i);if(i>=0)g.audioMins=parseDur(tx.slice(i,i+160))}catch{}}
    return g})();
  const SLOW={};/* si los catálogos ya encontraron datos, Goodreads tiene solo 1,2 s de gracia; si no, se espera a Goodreads completo */
  const cap=fbP.then(x=>hasData(x)?new Promise(r=>setTimeout(()=>r(SLOW),1200)):new Promise(()=>{}));
  let g=await Promise.race([grP,cap]);
  const late=g===SLOW;if(late)g=null;
  const x=await fbP;
  if(!hasData(g)){g=x;if(g)g.fallback=true}
  else if(!g.description||!g.genres.length||!g.pages){if(x){for(const k of['description','pages','publisher','year']){if(!g[k]&&x[k])g[k]=x[k]}if(!g.genres.length)g.genres=x.genres}}
  /* si Goodreads llega tarde, no te hace esperar: completa después (saga, valoración…) */
  if(late)grP.then(gg=>{if(gg&&hasData(gg)){apply(b,gg,false);save();if(typeof auRefresh==='function')try{auRefresh()}catch{}}}).catch(()=>{});
  if(!hasData(g)){save();return null}
  const d=(typeof draft!=='undefined'&&draft&&draft.id===b.id&&draft!==b)?draft:null;
  apply(b,g,!!o.force);b.syncOk=Date.now();if(g.fallback)b.grDone=0;if(d){apply(d,g,!!o.force);if(g.fallback)d.grDone=0}
  save();return g;
};
let syncing=false;
window.syncAllBooks=async function(){
  if(syncing)return;
  const list=data.books.filter(needsSync);let ok=0,fb=0,bad=0;const failed=[];const sh=ms=>new Promise(r=>setTimeout(r,ms));
  if(!list.length){toast('Todo está al día ✦');rerender();return}
  syncing=true;const btn=document.querySelector('.gsync button');if(btn)btn.disabled=true;
  try{
    let idx=0,done=0;const upd=()=>{const m=$('gsMsg');if(m)m.textContent=`Actualizando ${Math.min(done+1,list.length)} de ${list.length}…`};upd();
    const worker=async()=>{while(idx<list.length){const bk=list[idx++];let g=null;try{g=await syncGoodreads(bk,{search:true})}catch{}
      if(g){g.fallback?fb++:ok++;delete bk.syncFail;bk.syncOk=Date.now()}else{bad++;bk.syncFail=Date.now();failed.push(bk.title)}done++;upd()}};
    await Promise.all([worker(),worker(),worker()]);
  }finally{syncing=false}
  await save();
  const left=data.books.filter(needsSync).length;
  rerender();
  toast(failed.length?`Actualizados ${list.length-failed.length} de ${list.length}. Sin datos en internet: ${failed.slice(0,2).join(', ')}${failed.length>2?'…':''}. Puedes completarlos a mano en Editar.`:`¡Listo! ${list.length} libro${list.length===1?'':'s'} actualizado${list.length===1?'':'s'} ✦`);
};
/* se ejecuta solo: libros nuevos y, en segundo plano, los que aún no tienen la ficha completa */
const _en=enrich;enrich=async function(b){if(b&&needsSync(b)&&(b.goodreadsUrl||b.isbn))await syncGoodreads(b);return _en(b)};
const _is=importSearchResult;importSearchResult=function(r,i){const n=data.books.length;_is(r,i);const b=data.books[data.books.length-1];
  if(data.books.length>n&&b&&(b.goodreadsUrl||b.isbn)){toast('Trayendo datos de Goodreads…');syncGoodreads(b).then(g=>{if(!g)return toast('No pude leer Goodreads; usé los datos básicos');toast('Datos de Goodreads listos ✦');
    if(editorOpen(b.id))reopenEditor();else if(!$('dlg').open)rerender()})}};
let busy=false;async function grAll(){if(busy||!navigator.onLine)return;busy=true;let n=0;
  for(const b of data.books){if(!needsSync(b)||(!b.goodreadsUrl&&!b.isbn)||(b.grTried&&Date.now()-b.grTried<216e5))continue;if(++n>12)break;await syncGoodreads(b);await new Promise(r=>setTimeout(r,1500))}
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
  if(!g){m.textContent='No encontré datos ni en Goodreads, ni en Google Books, ni en Open Library. Revisa el ISBN o el título, o pega el enlace de la ficha de Goodreads.';return}
  toast(g.fallback?'Goodreads no respondió; completé con Google Books / Open Library ✦':'Datos de Goodreads listos ✦');if(editorOpen(draft.id))reopenEditor()};
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
