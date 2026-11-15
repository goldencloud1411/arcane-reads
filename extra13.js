/* Arcane Reads v2.5 — sagas y colecciones: orden A–Z, progreso, "Ver todo", continuar saga */
(function(){
const art=n=>String(n||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/^(the|a|an|el|la|los|las|un|una)\s+/,'');
const vol=b=>+b.sagaN>0?+b.sagaN:9999,yr=b=>parseInt(b.year,10)||9999,tc=(a,b)=>String(a.title||'').localeCompare(b.title||'','es');
function groups(kind){const m=new Map();data.books.forEach(b=>listOf(b,kind).forEach(n=>{if(!m.has(n))m.set(n,[]);m.get(n).push(b)}));
  return[...m.entries()].map(([name,bs])=>{bs=bs.slice().sort(kind==='saga'?(a,b)=>vol(a)-vol(b)||yr(a)-yr(b)||tc(a,b):tc);const read=bs.filter(b=>b.status==='Leído').length,reading=bs.some(b=>b.status==='Leyendo');
    return{name,books:bs,read,total:bs.length,pct:Math.round(read/bs.length*100),complete:read===bs.length,reading,cur:bs.find(b=>b.status==='Leyendo'),next:bs.find(b=>b.status==='Por leer'),authors:[...new Set(bs.map(b=>b.author).filter(Boolean))],idx:Math.max(...bs.map(b=>data.books.indexOf(b)))}})}
const KT={saga:'Sagas',collection:'Colecciones'};
const sc=(g,k)=>`<button class="sgc" data-n="${esc(g.name)}" onclick="openGroup('${k}',this.dataset.n)"><div class="sgs">${g.books.slice(0,4).map((b,i)=>`<div class="sgv" style="--i:${i}">${coverHtml(b)}</div>`).join('')}</div><b>${esc(g.name)}</b><span class="sgm">${g.read} de ${g.total} leído${g.read===1?'':'s'}${g.complete?' · <em class="done">✓ Completa</em>':g.reading?' · <em class="now">Leyendo</em>':''}</span>${bar(g.pct)}</button>`;
const hv=(b,sub)=>`<button class="hbook" onclick="bookDetails('${b.id}')"><div class="hcov">${b.sagaN?`<i class="vol">${b.sagaN}</i>`:''}${coverHtml(b)}</div><b>${esc(b.title)}</b><span>${sub}</span></button>`;
/* sección compacta (Para ti) */
const strip=k=>{const g=groups(k).sort((a,b)=>art(a.name).localeCompare(art(b.name),'es')),t=KT[k],more=g.length>12;
  return `<section><div class="label-row"><h2>${t} <span class="cntb">${g.length}</span></h2>${g.length?`<button class="link-btn" onclick="bt='${t}';render()">Ver todo ›</button>`:''}</div>${g.length?`<div class="hrow">${g.slice(0,12).map(x=>sc(x,k)).join('')}${more?`<button class="sgc more" onclick="bt='${t}';render()"><div class="sgs"><div class="sgmore">+${g.length-12}</div></div><b>Ver todas</b></button>`:''}</div>`:`<div class="empty">Escribe ${k==='saga'?'la saga':'una colección'} al editar un libro y se agruparán aquí.</div>`}</section>`};
/* página completa */
let sv={q:'',sort:'az',f:'all',k:'saga'};
const SORTS=[['az','A–Z'],['count','Más libros'],['prog','Progreso'],['new','Recientes']],FILT=[['all','Todas'],['go','En curso'],['done','Completas'],['new','Sin empezar']];
function results(){let g=groups(sv.k);const q=art(sv.q);if(q)g=g.filter(x=>art(x.name).includes(q)||x.authors.some(a=>art(a).includes(q)));
  g=g.filter(x=>sv.f==='all'||(sv.f==='done'&&x.complete)||(sv.f==='go'&&!x.complete&&(x.read>0||x.reading))||(sv.f==='new'&&x.read===0&&!x.reading));
  const cmp=(a,b)=>art(a.name).localeCompare(art(b.name),'es');g.sort(sv.sort==='count'?(a,b)=>b.total-a.total||cmp(a,b):sv.sort==='prog'?(a,b)=>b.pct-a.pct||cmp(a,b):sv.sort==='new'?(a,b)=>b.idx-a.idx:cmp);
  if(!g.length)return'<div class="empty">Nada coincide con tu búsqueda o filtro.</div>';
  if(sv.sort!=='az')return`<div class="sgrid">${g.map(x=>sc(x,sv.k)).join('')}</div>`;
  const L=new Map();g.forEach(x=>{const c=(art(x.name)[0]||'#').toUpperCase(),l=/[A-Z]/.test(c)?c:'#';if(!L.has(l))L.set(l,[]);L.get(l).push(x)});
  return[...L.entries()].map(([l,a])=>`<div class="sgl">${l}</div><div class="sgrid">${a.map(x=>sc(x,sv.k)).join('')}</div>`).join('')}
window.sgRefresh=()=>{const r=$('sgres');if(r)r.innerHTML=results()};
const chips=()=>[['Para ti','Para ti'],['Leyendo',`Leyendo ahora · ${readingBooks().length}`],['Por leer',`Por leer · ${unreadBooks().length}`],['Sagas',`Sagas · ${groups('saga').length}`],['Colecciones',`Colecciones · ${groups('collection').length}`],['Todos','Todos']].map(([k,t])=>`<button class="chip ${bt===k?'active':''}" onclick="bt='${k}';render()">${t}</button>`).join('');
function page(k){sv.k=k;const n=groups(k).length,w=document.createElement('div');w.className='section-gap';
  w.innerHTML=`<section><div class="label-row"><h2>${KT[k]} <span class="cntb">${n}</span></h2><button class="link-btn" onclick="bt='Para ti';render()">‹ Volver</button></div>
  <input id="sgq" class="sgq" type="search" placeholder="Buscar ${KT[k].toLowerCase()} o autor…" value="${esc(sv.q)}" oninput="sv.q=this.value;sgRefresh()">
  <div class="tabs sm">${SORTS.map(([v,t])=>`<button class="chip ${sv.sort===v?'active':''}" onclick="sv.sort='${v}';render()">${t}</button>`).join('')}</div>
  <div class="tabs sm">${FILT.map(([v,t])=>`<button class="chip ${sv.f===v?'active':''}" onclick="sv.f='${v}';render()">${t}</button>`).join('')}</div></section><section id="sgres">${results()}</section>`;
  const c=document.createElement('div');c.className='tabs';c.innerHTML=chips();w.prepend(c);return w}
window.sv=sv;
/* pestaña Libros */
const _rb13=renderBooks;renderBooks=function(){
  if(bt==='Sagas')return page('saga');if(bt==='Colecciones')return page('collection');
  const w=_rb13(),t=w.querySelector('.tabs');if(t)t.innerHTML=chips();if(bt!=='Para ti')return w;
  const secs=[...w.querySelectorAll('section')],find=h=>secs.find(s=>s.querySelector('h2')&&s.querySelector('h2').textContent.trim().startsWith(h));
  const ss=find('Sagas'),cs=find('Colecciones');if(ss)ss.outerHTML=strip('saga');if(cs)cs.outerHTML=strip('collection');
  const top=[],lee=data.books.filter(b=>b.status==='Leyendo');
  if(lee.length)top.push(`<section><h2>Leyendo ahora</h2><div class="hrow">${lee.map(b=>hv(b,`${b.pages?pct(b)+'%':'En curso'}`+(b.pages?bar(pct(b)):''))).join('')}</div></section>`);
  const cont=groups('saga').filter(g=>g.read>0&&!g.complete&&!g.reading&&g.next).sort((a,b)=>b.pct-a.pct).slice(0,8);
  if(cont.length)top.push(`<section><div class="label-row"><h2>Continúa tus sagas</h2></div><div class="hrow">${cont.map(g=>hv(g.next,`${esc(g.name)} · ${g.read}/${g.total}`)).join('')}</div></section>`);
  const lp=find('Lo próximo');if(top.length){if(lp)lp.insertAdjacentHTML('beforebegin',top.join(''));else w.insertAdjacentHTML('beforeend',top.join(''))}
  return w};
/* vista de una saga / colección */
const _og=openGroup;openGroup=function(kind,name){if(kind!=='saga'&&kind!=='collection')return _og(kind,name);const g=groups(kind).find(x=>x.name===name);if(!g)return _og(kind,name);
  const go=g.cur||g.next,lbl=g.cur?'Continuar':'Siguiente';
  showSheet(`<div class="sheet-header"><div><div class="eyebrow">${kind==='saga'?'Saga':'Colección'}</div><h2>${esc(g.name)}</h2><div class="muted small">${esc(g.authors.slice(0,2).join(', '))}</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>
  <div class="label-row" style="margin-top:6px"><span class="muted small">${g.read} de ${g.total} leído${g.read===1?'':'s'} · ${g.pct}%</span>${g.complete?'<em class="done">✓ Completa</em>':''}</div>${bar(g.pct)}
  ${go?`<button class="btn-soft nextb" onclick="bookDetails('${go.id}')">${lbl}: ${esc(go.title)}${kind==='saga'&&go.sagaN?` (nº ${go.sagaN})`:''} →</button>`:''}
  <div class="gg">${g.books.map(b=>`<button class="hbook" onclick="bookDetails('${b.id}')"><div class="hcov">${kind==='saga'&&b.sagaN?`<i class="vol">${b.sagaN}</i>`:''}${coverHtml(b)}${b.status==='Leído'?'<i class="ok">✓</i>':''}</div><b>${esc(b.title)}</b><span>${esc(b.status||'')}${b.status==='Leyendo'&&b.pages?' · '+pct(b)+'%':''}</span></button>`).join('')}</div>`)};
})();
