/* Arcane Reads v1.3 — estantería realista: libros pegados, sin scroll, acomodo automático y por saga */
(function(){
const esc2=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const skey=s=>String(s||'').trim().toLowerCase();
const LAYOUTS=[['saga','Por saga (cada saga junta)'],['auto','Automático (llena cada repisa)'],['manual','Manual (tú eliges la repisa)']];

/* orden de los libros antes de medirlos */
function ordered(books,mode){
  const idx=new Map(books.map((b,i)=>[b.id,i]));
  const yr=b=>parseInt(b.year,10)||9999, num=b=>(+b.sagaN>0?+b.sagaN:9999);
  if(mode==='saga'){
    const groups=new Map(), loose=[];
    books.forEach(b=>{const k=skey(b.saga); if(!k){loose.push(b);return} if(!groups.has(k))groups.set(k,[]); groups.get(k).push(b)});
    const out=[];
    groups.forEach((l,k)=>{l.sort((a,b)=>num(a)-num(b)||yr(a)-yr(b)||idx.get(a.id)-idx.get(b.id)); l.forEach(b=>out.push([b,l.length>1?k:'']))});
    loose.forEach(b=>out.push([b,'']));
    return out;
  }
  return books.slice().sort((a,b)=>(a.row||0)-(b.row||0)||idx.get(a.id)-idx.get(b.id)).map(b=>[b,'']);
}

renderShelfPreview=function(shelf,large=false){
  const books=data.books.filter(b=>b.shelf===shelf.id), mode=shelf.layout||'saga';
  const bg=shelf.background?`background-image:url('${shelf.background}');background-size:cover;background-position:center;`:(shelf.theme==='cozy'?'background:linear-gradient(#ad8d78,#6d5345);':shelf.theme==='dark'?'background:linear-gradient(#32272d,#161118);':'background:var(--library-bg);');
  const html=ordered(books,mode).map(([b,u],i)=>shelfBookHtml(b).replace('<button ',`<button data-o="${i}" data-u="${esc2(u)}" data-row="${b.row||0}" `)).join('');
  return `<div class="shelf-shell"><div class="shelf-preview" data-mode="${mode}" data-min="${shelf.rows||3}" data-cap="${large?0:3}" style="${bg}${large?'min-height:560px':'min-height:250px'}"><div class="shelf-pack">${html}</div></div></div>`;
};

/* reparte los libros en repisas según el ancho real de la pantalla */
function pack(items,avail,mode){
  const rows=[[]]; let used=0;
  const cur=()=>rows[rows.length-1];
  const next=()=>{if(cur().length){rows.push([]);used=0}};
  const put=it=>{if(used+it.w>avail)next(); cur().push(it); used+=it.w};
  if(mode==='manual'){
    const byRow=new Map(); items.forEach(it=>{if(!byRow.has(it.row))byRow.set(it.row,[]); byRow.get(it.row).push(it)});
    const out=[];
    [...byRow.keys()].sort((a,b)=>a-b).forEach(r=>{while(out.length<r)out.push([]); const sub=pack(byRow.get(r),avail,'auto'); sub.forEach(s=>out.push(s))});
    return out;
  }
  if(mode==='auto'){items.forEach(put);return rows}
  /* saga: una saga completa cabe en una repisa; si no, pasa a la siguiente (los sueltos rellenan huecos) */
  const sagas=[], loose=[]; const m=new Map();
  items.forEach(it=>{if(it.u){if(!m.has(it.u)){m.set(it.u,[]);sagas.push(m.get(it.u))}m.get(it.u).push(it)}else loose.push(it)});
  const fill=()=>{for(let i=0;i<loose.length;){if(used+loose[i].w<=avail){cur().push(loose[i]);used+=loose[i].w;loose.splice(i,1)}else i++}};
  sagas.forEach(g=>{const W=g.reduce((a,x)=>a+x.w,0);
    if(W<=avail){if(used+W>avail){fill();next()} g.forEach(x=>{cur().push(x);used+=x.w})}
    else{if(used>0){fill();next()} g.forEach(put)}});
  loose.forEach(put);
  return rows;
}

function build(prev){
  let pk=prev.querySelector('.shelf-pack');
  const w0=Math.floor(prev.clientWidth-parseFloat(getComputedStyle(prev).paddingLeft)-parseFloat(getComputedStyle(prev).paddingRight));
  if(!pk){ /* re-empaquetar (cambio de ancho): devolver los libros al área de medición */
    const bs=[...prev.querySelectorAll('.shelf-book')].sort((a,b)=>a.dataset.o-b.dataset.o);
    prev.querySelectorAll('.shelf-row').forEach(r=>r.remove());
    pk=document.createElement('div');pk.className='shelf-pack';bs.forEach(b=>pk.appendChild(b));prev.appendChild(pk);
  }
  const avail=Math.floor(pk.clientWidth)||w0; if(avail<40)return false;
  const mode=prev.dataset.mode||'saga', min=+prev.dataset.min||3, cap=+prev.dataset.cap||0;
  const items=[...pk.children].map(el=>({el,w:el.offsetWidth,u:el.dataset.u||'',row:+el.dataset.row||0}));
  let rows=pack(items,avail,mode);
  while(rows.length<min)rows.push([]);
  if(cap)rows=rows.slice(0,cap);
  const frag=document.createDocumentFragment();
  rows.forEach(r=>{const d=document.createElement('div');d.className='shelf-row';
    if(r.length)r.forEach(it=>d.appendChild(it.el)); else d.innerHTML='<div class="shelf-empty">Repisa vacía</div>';
    frag.appendChild(d)});
  pk.remove(); prev.appendChild(frag); prev.dataset.w=avail; return true;
}
function packAll(){document.querySelectorAll('.shelf-preview[data-mode]').forEach(p=>{if(p.querySelector('.shelf-pack'))build(p)})}
new MutationObserver(()=>{if(document.querySelector('.shelf-pack'))packAll()}).observe(document.documentElement,{childList:true,subtree:true});
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>document.querySelectorAll('.shelf-preview[data-mode]').forEach(p=>{
  const pad=parseFloat(getComputedStyle(p).paddingLeft)+parseFloat(getComputedStyle(p).paddingRight),w=Math.floor(p.clientWidth-pad);
  if(w>0&&Math.abs(w-(+p.dataset.w||0))>2)build(p)}),150)});

/* ajustes de la biblioteca: cómo acomodar */
const _ss=shelfSettings;shelfSettings=function(){_ss();const s=activeShelf(),r=$('shelfRows');if(!r)return;
  if(r.previousElementSibling)r.previousElementSibling.textContent='Número mínimo de repisas';
  r.insertAdjacentHTML('afterend',`<label>Cómo acomodar los libros</label><select id="shelfLayout">${LAYOUTS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select><div class="muted small" style="margin-top:6px">Las repisas se agregan solas cuando no caben más libros, así que nunca hay scroll horizontal.</div>`);
  $('shelfLayout').value=s.layout||'saga'};
const _sss=saveShelfSettings;saveShelfSettings=function(){const v=$('shelfLayout')&&$('shelfLayout').value;if(v)activeShelf().layout=v;_sss()};

/* número dentro de la saga (opcional) */
})();
