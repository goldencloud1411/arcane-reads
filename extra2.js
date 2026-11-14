/* Arcane Reads v0.9 — visor y editor de libro estilo SlowRead, pilas realistas, descripción oficial */
const _sh=showSheet;showSheet=function(h){$('dlg').classList.remove('edfull');_sh(h)};
function bindCube(){const p=$('preview');if(!p)return;let d=false,x=0;p.onpointerdown=e=>{d=true;x=e.clientX;p.setPointerCapture(e.pointerId)};p.onpointermove=e=>{if(d){cubeAngle+=(e.clientX-x)*.8;x=e.clientX;drawCube()}};p.onpointerup=p.onpointercancel=()=>d=false}
/* pilas */
const SO=[0,7,-5,9,-3,6],SW=[1,.93,.97,.89,.95,.91];
const stackDims=b=>({n:Math.max(2,Math.min(6,b.stackCount||3)),T:Math.max(14,Math.min(26,(b.thick||3)*5.7)),L:Math.min(150,(b.height||22)*5.7)});
function stackLayers(b,L,T,n){const edge=b.stackFace==='Canto',col=edge?(b.edgeColor||'#e6dbc7'):(b.color||'#7b5d7b'),img=edge?b.edge:b.spine;
  return Array.from({length:n},(_,i)=>{const w=Math.round(L*SW[i%6]);return `<div class="sly" style="width:${w}px;height:${T}px;margin-left:${SO[i%6]}px;background:${col}">${img?`<img src="${img}" alt="" style="position:absolute;left:50%;top:50%;width:${T}px;height:${w}px;transform:translate(-50%,-50%) rotate(-90deg);object-fit:fill">`:`<span class="sl">${esc(b.title||'')}</span>`}</div>`}).reverse().join('')}
const _sbh=shelfBookHtml;shelfBookHtml=function(b){if(b.display!=='Apilado')return _sbh(b);const{n,T,L}=stackDims(b);return `<button class="shelf-book stack-book" onclick="openBook('${b.id}')" style="width:${L+14}px;height:${n*T}px;gap:0">${stackLayers(b,L,T,n)}</button>`};
const _dc=drawCube;drawCube=function(){const c=$('cube');if(!c)return;if(draft&&draft.display==='Apilado'){const{n,T,L}=stackDims(draft);c.style.cssText=`width:${L+14}px;height:${n*T}px;display:flex;flex-direction:column;justify-content:flex-end;transform:rotateX(8deg) rotateY(-10deg)`;c.innerHTML=stackLayers(draft,L,T,n);return}c.style.cssText='';_dc()};
/* descripción oficial */
async function enrich(b){if(!b||(b.description&&b.pages&&b.publisher))return;try{
  const q=b.isbn?'isbn:'+b.isbn:`intitle:${b.title} inauthor:${b.author||''}`,j=await(await fetch('https://www.googleapis.com/books/v1/volumes?maxResults=1&q='+encodeURIComponent(q))).json(),v=j.items?.[0]?.volumeInfo;if(!v)return;
  const set=(k,x)=>{if(!x)return;if(!b[k])b[k]=x;if(draft&&draft.id===b.id&&!draft[k])draft[k]=x};
  set('description',stripHtml(v.description||''));set('pages',v.pageCount);set('publisher',v.publisher);set('year',String(v.publishedDate||'').slice(0,4));set('categories',(v.categories||[]).join(', '));set('isbn',(v.industryIdentifiers||[]).find(i=>i.type==='ISBN_13')?.identifier);
  save();const ta=document.querySelector('#secBasic textarea');if(ta&&draft&&draft.id===b.id&&!ta.value)ta.value=draft.description||''}catch{}}
const _isr=importSearchResult;importSearchResult=function(r,i){const n=data.books.length;_isr(r,i);const b=data.books[data.books.length-1];if(data.books.length>n)enrich(b)};
function bookDetails(id){const b=getBook(id);if(!b)return;const draw=()=>showSheet(`<div class="sheet-header"><div><h2>${esc(b.title)}</h2><div class="muted small">${esc(b.author||'')}</div></div><button class="sheet-close" onclick="closeSheet()">×</button></div>
  <div class="det"><div class="hcov" style="flex:0 0 96px;height:140px">${coverHtml(b)}</div><div class="small">${[b.pages&&b.pages+' páginas',b.year,b.publisher,b.categories,b.isbn&&'ISBN '+b.isbn,b.rating&&'★ '+b.rating].filter(Boolean).map(x=>`<div>${esc(String(x))}</div>`).join('')}</div></div>
  <h3 style="margin:14px 0 6px">Descripción oficial</h3><p id="dtxt" class="dtxt" style="white-space:pre-line">${b.description?esc(b.description):'<span class="muted">Buscando la descripción…</span>'}</p>${b.description?'<button class="link-btn" onclick="this.previousElementSibling.classList.toggle(\'open\');this.textContent=this.textContent===\'Leer más\'?\'Leer menos\':\'Leer más\'">Leer más</button>':''}
  <div class="editor-save-row" style="margin-top:14px"><button class="btn-soft" onclick="openBook('${id}')">Volver</button><button class="mini-btn" onclick="editBook('${id}')">Editar</button></div>`);
  draw();if(!b.description)enrich(b).then(()=>{if($('dtxt')){b.description?draw():$('dtxt').innerHTML='<span class="muted">No encontré descripción. Puedes escribirla al editar el libro.</span>'}})}
/* visor */
const actLabel=b=>b.status==='Leyendo'?'Devolver':b.status==='Leído'?'Releer':'Terminado';
function bookAction(id){const b=getBook(id);if(b.status==='Leyendo')b.status='Por leer';else if(b.status==='Leído'){b.status='Leyendo';b.current=0;b.finished=''}else{b.status='Leído';b.current=b.pages||b.current;b.finished=today()}save();closeSheet();rerender();toast(b.status==='Leído'?'¡Libro terminado!':'Listo')}
function startSession(id){const b=getBook(id);if(b.status!=='Leyendo'){b.status='Leyendo';save();rerender()}openReadingSession(id)}
function openBook(id){const b=getBook(id);if(!b)return;showSheet(`<div class="vw"><button class="vx" onclick="closeSheet()">×</button><div class="edstage"><div class="preview" id="preview"><div class="cube" id="cube"></div></div></div>
  <div class="vt"><b>${esc(b.title)}</b><span>${esc(b.author||'')}${b.pages?' · '+b.pages+' páginas':''}</span><button class="pill" onclick="startSession('${id}')">▯ Empezar sesión</button></div>
  <div class="vbar"><button onclick="bookDetails('${id}')">ⓘ<small>Detalles</small></button><button onclick="editBook('${id}')">⚙<small>Editar</small></button><button onclick="editBook('${id}');setTimeout(()=>edPanel('faces'),80)">📷<small>Fotos</small></button><button class="y" onclick="bookAction('${id}')">📚<small>${actLabel(b)}</small></button></div></div>`);
  $('dlg').classList.add('edfull');draft=structuredClone(b);cubeAngle=-20;drawCube();bindCube();if(!b.description)enrich(b)}
/* editor */
let edCur='',edSel='cover';
const chipRow=(arr,isOn,fn)=>`<div class="chips">${arr.map(s=>`<button class="chip ${isOn(s)?'active':''}" onclick="${fn(s)}">${s}</button>`).join('')}</div>`;
const PANELS={
 size:()=>`<h4>Medidas</h4>${chipRow(['Bolsillo','Tapa blanda','Tapa dura'],()=>0,s=>`setSize('${s}')`)}<div class="row3">${[['Alto','height'],['Ancho','width'],['Grosor','thick']].map(([l,k])=>`<label>${l} (cm)<input type="number" step=".1" min=".1" value="${draft[k]||0}" oninput="draft.${k}=+this.value;drawCube()"></label>`).join('')}</div>`,
 format:()=>`<h4>Vista en repisa</h4>${chipRow(['Lomo','Portada','Canto','Apilado'],s=>draft.display===s,s=>`draft.display='${s}';drawCube();edPanel('format',1)`)}${draft.display==='Apilado'?`<h4>Libros en la pila</h4>${chipRow([2,3,4,5,6],n=>(draft.stackCount||3)===n,n=>`draft.stackCount=${n};drawCube();edPanel('format',1)`)}<h4>Cara visible</h4>${chipRow(['Lomo','Canto'],s=>(draft.stackFace==='Canto')===(s==='Canto'),s=>`draft.stackFace='${s}';drawCube();edPanel('format',1)`)}`:''}<h4>Formato</h4>${chipRow(['Tapa blanda','Tapa dura','Digital','Audiolibro'],s=>draft.format===s,s=>`draft.format='${s}';edPanel('format',1)`)}`,
 color:()=>`<h4>Colores</h4><div class="row3"><label>Lomo<input type="color" value="${draft.color||'#7b5472'}" oninput="draft.color=this.value;drawCube()"></label><label>Canto<input type="color" value="${draft.edgeColor||'#e6dbc7'}" oninput="draft.edgeColor=this.value;drawCube()"></label></div>`,
 faces:()=>`<div class="faces">${[['cover','Portada',0],['spine','Lomo',90],['edge','Canto',-90],['back','Contraportada',180]].map(([k,t,a])=>`<button class="fb ${edSel===k?'on':''}" onclick="edSel='${k}';cubeAngle=${a};drawCube();edPanel('faces',1)"><div class="ft" style="${draft[k]?`background-image:url(${draft[k]})`:''}">${draft[k]?'<b>✓</b>':''}</div>${t}</button>`).join('')}</div>
  <label class="act">Escanear<span>📷</span><input type="file" accept="image/*" capture="environment" hidden onchange="pickFace(edSel,this)"></label><label class="act">Elegir de la galería<span>🖼</span><input type="file" accept="image/*" hidden onchange="pickFace(edSel,this)"></label><button class="act red" onclick="draft[edSel]='';drawCube();edPanel('faces',1)">Quitar foto<span>⊖</span></button>`};
function setSize(n){const[h,w,t]={'Bolsillo':[18,11,2],'Tapa blanda':[21,14,3],'Tapa dura':[23,16,4]}[n];Object.assign(draft,{height:h,width:w,thick:t});drawCube();edPanel('size',1)}
function edPanel(k,force){const m=$('edmore'),p=$('edpop');if(!m)return;edCur=edCur===k&&!force?'':k;m.hidden=p.hidden=true;document.querySelectorAll('.edbar button').forEach(b=>b.classList.toggle('on',b.dataset.k===edCur));if(!edCur)return;if(k==='more'){m.hidden=false;return}p.innerHTML=PANELS[k]();p.hidden=false}
window.onFaceSaved=()=>{if(edCur==='faces')edPanel('faces',1)};
const _eb=editBook;editBook=function(id,o){_eb(id,o);edCur='';edSel='cover';const dlg=$('dlg'),sh=dlg.querySelector('.sheet'),shell=sh.querySelector('.editor-shell');dlg.classList.add('edfull');
  const stage=document.createElement('div');stage.className='edstage';stage.appendChild($('preview'));
  const more=document.createElement('div');more.id='edmore';more.className='pop';more.hidden=true;['secBasic','secShelf','secPhotos'].forEach(i=>more.appendChild($(i)));more.appendChild(shell.querySelector('.editor-actionbar'));
  const pop=document.createElement('div');pop.id='edpop';pop.className='pop';pop.hidden=true;
  const bar=document.createElement('div');bar.className='edbar';bar.innerHTML=[['size','📏'],['format','▥'],['color','🎨'],['faces','📷'],['more','⋯']].map(([k,i])=>`<button data-k="${k}" onclick="edPanel('${k}')" aria-label="${k}">${i}</button>`).join('');
  const top=document.createElement('div');top.className='edtop';top.innerHTML='<button class="vx" onclick="closeSheet()">×</button><button class="gold" onclick="saveBook()">Guardar</button>';
  shell.style.display='none';sh.append(top,stage,more,pop,bar);bindCube();drawCube()};
