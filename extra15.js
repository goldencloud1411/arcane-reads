/* Arcane Reads v2.8 — los audiolibros salen de las repisas (viven en la vista "Audiolibros") + insignia 🎧 */
(function(){
const AUD=b=>b.format==='Audiolibro',HP='<svg viewBox="0 0 24 24"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>';
const st=document.createElement('style');st.textContent='.aud-b{position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;background:rgba(10,10,20,.72);display:grid;place-items:center;color:#fff;z-index:4;pointer-events:none}.aud-b svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}button img,.saga img,.hcov img{pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none;user-select:none}';document.head.appendChild(st);
const _rsp=renderShelfPreview;renderShelfPreview=function(shelf,large){const all=data.books;let h;data.books=all.filter(b=>!AUD(b));try{h=_rsp(shelf,large)}finally{data.books=all}return h};
const idOf=el=>el.dataset.id||((el.getAttribute('onclick')||'').match(/\('([^']+)'\)/)||[])[1]||'';
function badges(){document.querySelectorAll('.book-card,.hbook').forEach(el=>{if(el.querySelector('.aud-b'))return;const b=getBook(idOf(el));if(b&&AUD(b)){if(getComputedStyle(el).position==='static')el.style.position='relative';el.insertAdjacentHTML('beforeend',`<i class="aud-b" title="Audiolibro">${HP}</i>`)}})}
const _r=render;render=function(){_r();badges()};
})();
