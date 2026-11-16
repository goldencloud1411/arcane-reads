/* Arcane Reads v2.2 — sincronizar Goodreads (las estrellas animadas y el salto con retraso se quitaron: eran lentos) */
(function(){
const card=()=>{const n=data.books.filter(needsSync).length;if(!n)return null;const d=document.createElement('div');
  d.innerHTML=`<section class="card gsync"><div><strong>Datos de los libros</strong><div class="muted small" id="gsMsg">${n} libro${n===1?'':'s'} por actualizar (sinopsis, géneros, páginas…)</div></div><button class="mini-btn" onclick="syncAllBooks()">✦ Actualizar</button></section>`;return d.firstElementChild};
const _rp=renderProfile;renderProfile=function(){const w=_rp();const c=card();if(c)w.appendChild(c);return w};
/* la tarjeta de actualizar solo vive en Perfil */
})();
