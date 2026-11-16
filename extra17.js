/* Arcane Reads v2.9 — Audioteca en lista con detalles, onda de sonido (sin tocadisco) y datos desde Audible / GraphicAudio */
(function(){
const AUD=b=>b.format==='Audiolibro',live=()=>data.live&&data.live.since?data.live.bookId:null;
const MIC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const HPH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>';
const PLAY='<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',PAUSE='<svg viewBox="0 0 24 24" width="20" height="20"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
const tot=b=>(+b.audioMins||0)+(+b.audioSecs||0)/60,heard=b=>(data.sessions||[]).filter(s=>s.bookId===b.id).reduce((a,s)=>a+(+(s.minutes||s.mins||s.duration||s.min)||0)+(+s.secs||0)/60,0);
const fd=m=>{const t=Math.round((+m||0)*60);if(t<=0)return'—';const h=Math.floor(t/3600),r=Math.floor(t%3600/60),s=t%60;return [h?h+' h':'',r?r+' min':'',s?s+' s':''].filter(Boolean).join(' ')};
const prog=b=>b.status==='Leído'?100:tot(b)?Math.min(100,Math.round(heard(b)/tot(b)*100)):(typeof pct==='function'?pct(b):0);
const srcOf=b=>b.audioSrc||(/graphic ?audio|dramatized|full cast|reparto completo/i.test([b.title,b.narrator,b.publisher,(b.audio&&b.audio.publisher)||''].join(' '))?'graphicaudio':'audible');
const SRC={audible:'Audible',graphicaudio:'GraphicAudio'};
const list=sid=>data.books.filter(b=>b.shelf===sid&&AUD(b)&&(!window.__libActive||!__libActive()||__libMatch(b))).sort((a,b)=>String(a.title).localeCompare(String(b.title),'es'));
const cover=b=>(b.audio&&b.audio.cover)||b.cover||'';
const cov=b=>cover(b)?`<img src="${esc(cover(b))}" alt="" draggable="false">`:`<div class="au-ph" style="background:${esc(b.color||'#4b3f6b')}">${HPH}</div>`;
/* ── búsqueda de datos ─────────────────────────────────── */
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\[.*?\]|\(.*?\)/g,' ').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const base=t=>norm(String(t||'').split(/[:–—]/)[0]);
const clean=h=>{const d=document.createElement('div');d.innerHTML=String(h||'').replace(/<br\s*\/?>|<\/p>/gi,'\n');return d.textContent.replace(/\n{3,}/g,'\n\n').trim()};
const ROUTES=[x=>x,u=>'https://corsproxy.io/?url='+encodeURIComponent(u),u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u),u=>'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(u)];
/* antes se probaban una a una (hasta 12 s cada una = minutos); ahora van todas a la vez y gana la primera que responde */
const race=(u,kind)=>new Promise(res=>{let left=ROUTES.length,done=false;const cs=[];
  ROUTES.forEach(p=>{const c=new AbortController(),tm=setTimeout(()=>c.abort(),9000);cs.push(c);
    fetch(p(u),{signal:c.signal}).then(async r=>{if(!r.ok)throw 0;const v=kind==='json'?await r.json():await r.text();if(kind==='text'&&v.length<=400)throw 0;if(done)return;done=true;cs.forEach(x=>x!==c&&x.abort());res(v)})
    .catch(()=>{if(--left===0&&!done)res(kind==='json'?null:'')}).finally(()=>clearTimeout(tm))})});
const getJSON=u=>race(u,'json'),getText=u=>race(u,'text');
async function audible(b,dram){const t=String(b.title||'').split(/[:–—]/)[0].trim(),au=String(b.author||'').split(/[,&]/)[0].trim(),sur=norm(au).split(' ').pop();
  const one=async host=>{
    const j=await getJSON(`https://${host}/1.0/catalog/products?num_results=12&products_sort_by=Relevance&title=${encodeURIComponent(t)}${au?'&author='+encodeURIComponent(au):''}&response_groups=product_desc,product_attrs,contributors,media,rating,series,product_extended_attrs`);
    const sc=p=>{const pt=base(p.title);let s=0;if(pt===base(t))s+=5;else if(pt.includes(base(t))||base(t).includes(pt))s+=2;else return-1;if((p.authors||[]).some(a=>norm(a.name).includes(sur)))s+=3;const dr=/dramatized/i.test(p.title);s+=dram?(dr?6:0):(dr?-6:0);if(p.format_type==='unabridged')s+=1;return s+Math.min(1,((p.rating&&p.rating.overall_distribution&&p.rating.overall_distribution.num_ratings)||0)/1000)};
    const best=((j&&j.products)||[]).map(p=>[sc(p),p]).filter(x=>x[0]>=0).sort((a,b)=>b[0]-a[0])[0];
    if(!best)return null;{const p=best[1],r=(p.rating&&p.rating.overall_distribution)||{},sr=(p.series||[])[0]||{},im=p.product_images||{};
      return{score:best[0],a:{src:'audible',asin:p.asin,narrators:(p.narrators||[]).map(n=>n.name),authors:(p.authors||[]).map(a=>a.name),mins:+p.runtime_length_min||0,publisher:p.publisher_name||'',release:p.release_date||p.issue_date||'',lang:p.language||'',rating:+r.display_average_rating||0,ratings:+r.num_ratings||0,series:sr.title||'',seriesNum:sr.sequence||'',summary:clean(p.merchandising_summary||p.publisher_summary||''),cover:im['500']||im['1024']||Object.values(im)[0]||'',abridged:p.format_type==='abridged',url:`https://www.audible.com/pd/${p.asin}`}}}};
  const rs=(await Promise.all(['api.audible.com','api.audible.es'].map(h=>one(h).catch(()=>null)))).filter(Boolean).sort((x,y)=>y.score-x.score);return rs.length?rs[0].a:null}
async function gaPage(u){const h=await getText(u);if(!h)return null;const doc=new DOMParser().parseFromString(h,'text/html'),tx=(doc.body?doc.body.textContent:'').replace(/\s+/g,' ');
  const rt=tx.match(/Approximate Running Time:\s*([\d.]+)\s*Hours?(?:\s*(?:and)?\s*(\d+)\s*Min)?/i),isbn=(tx.match(/ISBN\s*#?:\s*((?:\d[\s-]?){10,13})/i)||[])[1],rated=(tx.match(/Content Rating:\s*(Ages? [\d+]+|[A-Za-z0-9+ ]{2,14}?)(?=\s+Genre|\s+ISBN|\s+Approx|$)/i)||[])[1],
    gen=(tx.match(/Genre:\s*(Action \/ Adventure|Fantasy Romance|Urban Fantasy|Science Fiction|Historical Fiction|Post-Apocalyptic|Weird Western|Young Adult|LitRPG - Games|Faith & Courage|Fantasy|Horror|Humor|Kids|Manga|Mystery|Sports|Thriller|Western|Comics|Afrofuturism)/i)||[])[1],
    nar=(tx.match(/(?:Narrated by|Narrator|Read by):\s*(.{3,80}?)(?=\s+(?:Author|Publisher|Genre|ISBN|Approx|Content)|$)/i)||[])[1],dt=tx.match(/(?:Release Date|Publication Date|Published):\s*([A-Za-z]+\.? \d{1,2}, \d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  const d=doc.querySelector('.product.attribute.description .value, .product.attribute.overview .value, [itemprop=description]');
  return{title:(doc.querySelector('meta[property="og:title"]')||{}).content||doc.title||'',mins:rt?Math.round(parseFloat(rt[1])*60+(+rt[2]||0)):0,isbn:(isbn||'').replace(/\D/g,''),rated:rated||'',genre:gen||'',desc:d?d.textContent.trim():'',nar:nar||'Reparto completo',release:dt?dt[1]:'',url:u}}
async function graphic(b){const q=String(b.title||'').split(/[:–—]/)[0].trim(),h=await getText('https://www.graphicaudio.net/catalogsearch/result/?q='+encodeURIComponent(q));if(!h)return null;
  const doc=new DOMParser().parseFromString(h,'text/html'),bt=s=>norm(String(s).replace(/\s*\d+\s+of\s+\d+\s*$/i,'')),seen=new Set(),
    links=[...doc.querySelectorAll('a.product-item-link,.product-item-name a')].map(a=>({t:a.textContent.trim(),u:new URL(a.getAttribute('href'),'https://www.graphicaudio.net/').href})).filter(x=>{const k=bt(x.t);if(seen.has(x.u)||!(k.includes(norm(q))||norm(q).includes(k)))return false;seen.add(x.u);return true}).slice(0,6);
  if(!links.length)return null;const pages=(await Promise.all(links.map(l=>gaPage(l.u).catch(()=>null)))).filter(Boolean);if(!pages.length)return null;
  const t0=pages[0].title,sm=t0.match(/^(.*?)\s+(\d+(?:\.\d+)?):\s*(.+?)(?:\s+\d+ of \d+)?\s*(?:\[.*\])?$/),pm=t0.match(/(\d+) of (\d+)/),f=pages.find(p=>p.desc)||{},g=pages[0];
  return{src:'graphicaudio',narrators:[g.nar],mins:pages.reduce((a,p)=>a+p.mins,0),publisher:'GraphicAudio',release:g.release,rated:g.rated,genre:g.genre,summary:f.desc||'',isbn:g.isbn,parts:pm?+pm[2]:(pages.length>1?pages.length:0),series:sm?sm[1]:(b.saga||''),seriesNum:sm?sm[2]:'',lang:'',rating:0,abridged:false,url:g.url,cover:''}}
async function audioSync(b,force){const src=srcOf(b);let a=null;try{a=src==='graphicaudio'?(await graphic(b))||(await audible(b,true)):(await audible(b))}catch{}
  b.audioTried=Date.now();if(!a){save();return null}
  a.src=src;a.fetched=Date.now();b.audio=a;
  if(a.mins&&(force||!b.audioMins)){if(+b.audioMins!==a.mins)b.audioSecs=0;b.audioMins=a.mins}if(a.narrators&&a.narrators.length&&(force||!b.narrator))b.narrator=a.narrators.slice(0,3).join(', ');
  if(!b.publisher&&a.publisher)b.publisher=a.publisher;if(!b.year&&a.release)b.year=String(a.release).slice(-4).match(/\d{4}/)?String(a.release).slice(-4):String(a.release).slice(0,4);
  if(!b.description&&a.summary)b.description=a.summary;if(a.series&&!b.saga){b.saga=a.series;if(a.seriesNum&&!b.sagaN)b.sagaN=+a.seriesNum||''}if(a.isbn&&!b.isbn)b.isbn=a.isbn;
  save();return a}
window.audioSync=audioSync;
let _aa=0;async function audioAll(){if(_aa||!navigator.onLine)return;_aa=1;let n=0;try{for(const b of data.books.filter(AUD)){if(b.audio||(b.audioTried&&Date.now()-b.audioTried<12e5))continue;if(++n>8)break;if(await audioSync(b))auRefresh();await new Promise(r=>setTimeout(r,500))}}finally{_aa=0}}
/* ── vista: hero con onda + lista detallada ────────────── */
const wave=b=>{const p=prog(b),n=42,seed=[...b.id].reduce((a,c)=>a+c.charCodeAt(0),0);return`<div class="au-wave">${Array.from({length:n},(_,i)=>`<i class="${i/n*100<p?'on':''}" style="--h:${22+Math.round((Math.sin(i*1.7+seed)*.5+.5)*70)}%;--d:${(i%7)*.11}s"></i>`).join('')}</div>`};
const badge=b=>{const s=srcOf(b);return s==='graphicaudio'?'<em class="al-src ga">GraphicAudio · Full cast</em>':'<em class="al-src">Audible</em>'};
const row=b=>{const a=b.audio||{},p=prog(b),sr=a.series||b.saga,sn=a.seriesNum||b.sagaN,ch=[tot(b)?`<i>${fd(tot(b))}</i>`:'',sr?`<i>${esc(sr)}${sn?' · nº '+esc(String(sn)):''}</i>`:'',(a.release||b.year)?`<i>${esc(String(a.release||b.year).match(/\d{4}/)?String(a.release||b.year).match(/\d{4}/)[0]:'')}</i>`:'',a.rating?`<i class="st">★ ${(+a.rating).toFixed(1)}</i>`:'',a.parts?`<i>${a.parts} partes</i>`:''].filter(Boolean).join('');
  return`<div class="au-card al-row" data-id="${b.id}" onclick="bookDetails('${b.id}')" role="button" tabindex="0"><div class="al-cov">${cov(b)}${b.status==='Leído'?'<span class="au-ok">✓</span>':''}</div>
  <div class="al-info"><b>${esc(b.title)}</b><span class="al-by">${esc(b.author||'')}</span>${b.narrator?`<span class="al-nar">${MIC}${esc(b.narrator)}</span>`:''}<div class="al-chips">${ch}</div><div class="al-bar" style="--p:${p}%"><i></i></div><div class="al-pt"><span>${p?p+'%':'Sin empezar'}${tot(b)&&p&&p<100?' · faltan '+fd(Math.max(0,tot(b)-heard(b))):''}</span>${badge(b)}</div></div>
  <button class="al-play" aria-label="Escuchar" onclick="event.stopPropagation();auPlay('${b.id}')">${live()===b.id?PAUSE:PLAY}</button></div>`};
function html(sid){const l=list(sid);if(!l.length)return`<div class="au-view"><div class="au-empty">${HPH}<b>Aún no hay audiolibros aquí</b><span>Cambia el formato de un libro a «Audiolibro» en el editor y aparecerá en esta lista.</span></div></div>`;
  const last=b=>{const S=data.sessions||[];for(let i=S.length-1;i>=0;i--)if(S[i].bookId===b.id)return i;return-1},h=l.find(x=>x.id===live())||l.filter(x=>x.status==='Leyendo'&&last(x)>=0).sort((a,b)=>last(b)-last(a))[0]||l.find(x=>x.status==='Leyendo')||l.find(x=>x.status==='Por leer')||l[0],run=live()===h.id,p=prog(h),tt=l.reduce((a,b)=>a+tot(b),0),hh=l.reduce((a,b)=>a+heard(b),0);
  /* el audiolibro destacado ya no se repite en las listas de abajo */
  const sec=(t,f)=>{const x=l.filter(b=>b.id!==h.id&&f(b)).sort((a,b)=>last(b)-last(a));return x.length?`<section class="au-sec"><h3>${t}<small>${x.length}</small></h3><div class="al-list">${x.map(row).join('')}</div></section>`:''};
  const label=run?'Sonando ahora':h.status==='Leyendo'?'Para continuar':h.status==='Leído'?'Terminado':'Siguiente';
  return`<div class="au-view"><div class="au-stats"><i><b>${l.length}</b> audiolibro${l.length>1?'s':''}</i>${hh>0?`<i><b>${fd(hh)}</b> escuchadas</i>`:''}${tt?`<i><b>${fd(tt)}</b> en total</i>`:''}</div>
  <section class="au-hero cp${run?' playing':''}" data-id="${h.id}" style="--c:${esc(h.color||'#6b5aa8')}" onclick="bookDetails('${h.id}')" role="button" tabindex="0"><div class="ah-cov">${cov(h)}</div>
   <div class="au-meta"><small>${label}<span class="eq"><i></i><i></i><i></i><i></i></span>${badge(h)}</small><b>${esc(h.title)}</b><span>${esc(h.author||'')}${h.narrator?' · Narra '+esc(h.narrator):''}</span></div>
   <button class="au-play" aria-label="Escuchar" onclick="event.stopPropagation();auPlay('${h.id}')"><span class="ia">${PLAY}</span><span class="ip">${PAUSE}</span></button>
   <div class="ah-prog"><div class="au-bar" style="--p:${p}%"><i></i></div><div class="au-times"><span>${heard(h)?fd(heard(h))+' · ':''}${p}%</span><span>${tot(h)?'faltan '+fd(Math.max(0,tot(h)-heard(h))):'sin duración'}</span></div></div></section>
  ${sec('En curso',b=>b.status==='Leyendo')}${sec('Por escuchar',b=>b.status==='Por leer')}${sec('Terminados',b=>b.status==='Leído')}${sec('Otros',b=>!['Leyendo','Por leer','Leído'].includes(b.status))}</div>`}
/* mantener el estado "sonando" del destacado al día */
setInterval(()=>{const h=document.querySelector('.au-hero[data-id]');if(h)h.classList.toggle('playing',live()===h.dataset.id)},900);
function auRefresh(){const e=document.querySelector('.au-view');if(!e)return;const t=document.createElement('div');t.innerHTML=html(activeShelf().id);e.replaceWith(t.firstElementChild)}
window.auPick=id=>bookDetails(id);
window.auPlay=id=>{if(live()===id){const b=document.querySelector('#mini button:not(.mp-open)');b&&b.click()}else startSession(id)};
let isAudio=()=>{try{return localStorage.getItem('ar_libview')==='audio'}catch(e){return false}};
const _rl4=renderLibrary;renderLibrary=function(){const w=_rl4();if(isAudio()){const e=w.querySelector('.au-view');if(e){const t=document.createElement('div');t.innerHTML=html(activeShelf().id);e.replaceWith(t.firstElementChild)}setTimeout(audioAll,500)}return w};
/* ── ficha: bloque con todos los datos del audiolibro ──── */
const ROW=(l,v)=>v?`<div class="ai-r"><span>${l}</span><b>${esc(String(v))}</b></div>`:'';
function audioBlock(b){const a=b.audio||{},s=srcOf(b);
  return`<section class="au-info" data-id="${b.id}"><h3>${HPH.replace('<svg','<svg class="ic"')} Audiolibro · ${SRC[s]}</h3><div class="ai-g">${ROW('Narrador',b.narrator||(a.narrators||[]).join(', '))}${ROW('Duración',tot(b)?fd(tot(b)):'')}${ROW('Editorial',a.publisher||b.publisher)}${ROW('Publicado',a.release)}${ROW('Idioma',({english:'Inglés',spanish:'Español',french:'Francés',german:'Alemán',italian:'Italiano',portuguese:'Portugués'})[String(a.lang).toLowerCase()]||a.lang)}${ROW('Valoración',a.rating?`★ ${(+a.rating).toFixed(1)} (${a.ratings||0})`:'')}${ROW('Serie',a.series?a.series+(a.seriesNum?' · nº '+a.seriesNum:''):'')}${ROW('Partes',a.parts?a.parts+' partes':'')}${ROW('Clasificación',a.rated)}${ROW('Género',a.genre)}${ROW('Versión',a.abridged?'Resumida':a.src?'Completa':'')}${ROW(a.asin?'ASIN':'ISBN',a.asin||a.isbn)}</div>
  ${a.summary&&norm(a.summary).slice(0,80)!==norm(b.description||'').slice(0,80)?`<p class="ai-sum">${esc(a.summary)}</p>`:''}<div class="ai-act"><button class="mini-btn" onclick="audioRefresh('${b.id}')">Actualizar datos del audiolibro</button>${a.url?`<a class="link-btn" href="${esc(a.url)}" target="_blank" rel="noopener">Ver en ${SRC[s]} ↗</a>`:''}</div>${a.fetched?'':'<div class="muted small">Aún no hay datos de '+SRC[s]+'. Toca «Actualizar».</div>'}</section>`}
const busy={};
window.audioRefresh=async id=>{
  const b=getBook(id);if(!b||busy[id])return;busy[id]=1;
  const blk=()=>document.querySelector(`.au-info[data-id="${id}"]`);
  const say=(m,k)=>{const x=blk();if(!x)return;x.querySelectorAll(':scope > .muted.small').forEach(e=>e.remove());let s=x.querySelector('.ai-status');if(!s){s=document.createElement('div');s.className='ai-status';x.appendChild(s)}s.className='ai-status'+(k?' '+k:'');s.textContent=m};
  const bt=blk()&&blk().querySelector('.ai-act .mini-btn');if(bt){bt.disabled=true;bt.innerHTML='<i class="spin"></i>Buscando…'}
  const name=SRC[srcOf(b)];let sec=0;say(`Buscando en ${name}…`);
  const tk=setInterval(()=>say(`Buscando en ${name}… ${++sec} s`),1000);
  let a=null;try{a=await audioSync(b,true)}catch{}finally{clearInterval(tk);busy[id]=0}
  const x=blk();   /* ¿sigues viendo la ficha de este libro? */
  if(x){x.outerHTML=audioBlock(b);say(a?'✓ Datos actualizados':`No encontré este audiolibro en ${name}. Revisa el título y el autor en Editar.`,a?'ok':'err')}
  else toast(a?'Datos del audiolibro actualizados':'No encontré este audiolibro en '+name);   /* si ya saliste, solo un aviso: no se abre nada */
  auRefresh();
};
new MutationObserver(()=>{const db=document.querySelector('.dt-body');if(!db||db.querySelector('.au-info'))return;const m=((document.querySelector('.dt-bar [onclick*="startSession("]')||{}).getAttribute&&document.querySelector('.dt-bar [onclick*="startSession("]').getAttribute('onclick')||'').match(/'([^']+)'/),b=m&&getBook(m[1]);
  if(!b||!AUD(b))return;const sy=[...db.querySelectorAll('h3')].find(h=>/Sinopsis/i.test(h.textContent));if(sy)sy.insertAdjacentHTML('beforebegin',audioBlock(b));else db.insertAdjacentHTML('beforeend',audioBlock(b))}).observe($('dlg'),{childList:true,subtree:true});
/* ── editor: elegir producción y traer datos ───────────── */
const _eb17=editBook;editBook=function(id,o){_eb17(id,o);const sb=$('secBasic');if(!sb||sb.dataset.au2||!draft)return;sb.dataset.au2=1;const nl=[...sb.querySelectorAll('label')].find(l=>/^Narrador/.test(l.textContent.trim()));if(!nl||!nl.nextElementSibling)return;
  nl.nextElementSibling.insertAdjacentHTML('afterend',`<label>Producción del audiolibro</label><select onchange="draft.audioSrc=this.value"><option value="">Automática</option><option value="audible" ${draft.audioSrc==='audible'?'selected':''}>Audible (un narrador)</option><option value="graphicaudio" ${draft.audioSrc==='graphicaudio'?'selected':''}>GraphicAudio (reparto completo)</option></select><button type="button" class="mini-btn" style="margin-top:8px" onclick="audioFromEditor()">Traer datos del audiolibro</button><div id="auMsg" class="muted small" style="margin-top:6px"></div>`)};
window.audioFromEditor=async()=>{const m=$('auMsg');if(!m||!draft)return;const nm=SRC[srcOf(draft)];let sc=0;m.textContent='Buscando en '+nm+'…';const tk=setInterval(()=>{m.textContent='Buscando en '+nm+'… '+(++sc)+' s'},1000);let a=null;try{a=await audioSync(draft,true)}catch{}finally{clearInterval(tk)}if(!a){m.textContent='No encontré este audiolibro. Revisa el título y el autor, o escribe los datos a mano.';return}
  const sb=$('secBasic'),inp=p=>[...sb.querySelectorAll('input')].find(i=>i.placeholder===p);const M=+draft.audioMins||0,h=inp('horas'),mi=inp('minutos'),se=inp('segundos'),n=inp('Quién narra');if(h)h.value=M?Math.floor(M/60):'';if(mi)mi.value=M?M%60:'';if(se)se.value=+draft.audioSecs||'';if(n)n.value=draft.narrator||'';
  const ta=sb.querySelector('textarea');if(ta&&!ta.value&&draft.description)ta.value=draft.description;m.textContent=`Listo: ${fd(M)}${draft.narrator?' · Narra '+draft.narrator:''}`};
const _rr17=rerender;rerender=function(){_rr17();setTimeout(audioAll,900)};
setTimeout(audioAll,3000);addEventListener('online',()=>setTimeout(audioAll,1500));
})();
