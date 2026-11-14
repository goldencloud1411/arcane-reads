/* Arcane Reads v2.1 — estrellas visibles, libro que salta al tocar, sincronizar Goodreads */
(function(){
const st=document.createElement('div');st.id='stars';
for(let i=0;i<70;i++){const e=document.createElement('i'),z=1.6+Math.random()*2.4;e.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;width:${z}px;height:${z}px;--d:${2+Math.random()*4}s;--l:-${Math.random()*6}s;${Math.random()<.2?'background:#ffe3a3':''}`;st.appendChild(e)}
const sh=document.createElement('i');sh.className='shoot';st.appendChild(sh);document.body.prepend(st);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
window.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('.shelf-book');if(!el||el.__go||reduce)return;
  e.stopImmediatePropagation();e.preventDefault();el.classList.add('lift');setTimeout(()=>{el.classList.remove('lift');el.__go=true;el.click();el.__go=false},240)},true);
const card=()=>{const n=data.books.filter(b=>!b.grDone||!b.categories||!b.description).length,d=document.createElement('div');
  d.innerHTML=`<section class="card gsync"><div><strong>Datos de Goodreads</strong><div class="muted small" id="gsMsg">${n?n+' libro'+(n===1?'':'s')+' con datos por completar (sinopsis, géneros, saga, ISBN…)':'Tus libros tienen la ficha completa ✦'}</div></div><button class="mini-btn" onclick="syncAllBooks()">✦ Actualizar</button></section>`;return d.firstElementChild};
const _rp=renderProfile;renderProfile=function(){const w=_rp();w.appendChild(card());return w};
const _rb=renderBooks;renderBooks=function(){const w=_rb();w.insertBefore(card(),w.children[1]||null);return w};
})();
