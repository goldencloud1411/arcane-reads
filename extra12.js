/* Arcane Reads v2.4 — total de libros, repisa más arriba, madera personalizable */
(function(){
const WOODS=[['Nogal','#8d5b30'],['Roble claro','#b58a58'],['Cerezo','#8f4630'],['Caoba','#6a2f24'],['Ébano','#2b2422'],['Ceniza','#7c7570'],['Verde pino','#3f5a46']];
function hsl(hex){const n=parseInt(hex.slice(1),16),r=(n>>16)/255,g=((n>>8)&255)/255,b=(n&255)/255,M=Math.max(r,g,b),m=Math.min(r,g,b),l=(M+m)/2;let h=0,s=0;if(M!==m){const d=M-m;s=l>.5?d/(2-M-m):d/(M+m);h=M===r?(g-b)/d+(g<b?6:0):M===g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s,l]}
const css=(h,s,l)=>`hsl(${h.toFixed(0)} ${(s*100).toFixed(0)}% ${(Math.max(0,Math.min(1,l))*100).toFixed(0)}%)`;
window.woodVars=hex=>{if(!/^#[0-9a-f]{6}$/i.test(hex||''))return'';const[h,s,l]=hsl(hex);return`--w1:${css(h,s,l*1.3+.03)};--w2:${hex};--w3:${css(h,s,l*.75)};--w3b:${css(h,s,l*.65)};`};
/* madera de la repisa */
const _rsp=renderShelfPreview;renderShelfPreview=function(shelf,large){const h=_rsp(shelf,large);return shelf.wood?h.replace('style="','style="'+woodVars(shelf.wood)):h};
const _ss2=shelfSettings;shelfSettings=function(){_ss2();const s=activeShelf(),f=document.querySelector('#dlg .field');if(!f)return;window.__wood=s.wood||'';
  f.insertAdjacentHTML('beforeend',`<label>Madera de las repisas</label><div class="woodsample" id="woodPrev" style="${woodVars(s.wood)}"></div><div class="woods">${WOODS.map(([n,c])=>`<button type="button" class="wd ${(s.wood||'#8d5b30').toLowerCase()===c?'on':''}" data-c="${c}" style="${woodVars(c)}">${n}</button>`).join('')}<label class="wd custom">Otro color<input type="color" id="woodPick" value="${s.wood||'#8d5b30'}"></label></div>`);
  const set=c=>{window.__wood=c==='#8d5b30'?'':c;$('woodPrev').style.cssText=woodVars(c);document.querySelectorAll('.wd[data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c===c))};
  f.querySelectorAll('.wd[data-c]').forEach(b=>b.onclick=()=>{set(b.dataset.c);$('woodPick').value=b.dataset.c});$('woodPick').oninput=e=>set(e.target.value)};
const _sss2=saveShelfSettings;saveShelfSettings=function(){const s=activeShelf();if(window.__wood)s.wood=window.__wood;else delete s.wood;_sss2()};
/* total de libros arriba */
const _rl3=renderLibrary;renderLibrary=function(){const w=_rl3(),sh=activeShelf(),tot=data.books.filter(b=>b.shelf===sh.id).length,sub=w.querySelector('.label-row .muted.small');
  if(sub){const inf=w.querySelector('.libf-info span'),n=inf?parseInt(inf.textContent):null;sub.innerHTML=`${esc(sh.name)} · <b class="cnt">${n!==null?n+' de ':''}${tot} libro${tot===1?'':'s'}</b>`}return w};
/* la primera repisa se pega al encabezado, sea del alto que sea */
function fitTop(){const app=$('app'),h=document.querySelector('.immersive .section-gap>section:first-child');if(!h){app.style.removeProperty('--hdr');return}app.style.setProperty('--hdr',Math.max(110,h.offsetTop+h.offsetHeight-30)+'px')}
const _r12=render;render=function(){_r12();requestAnimationFrame(fitTop);setTimeout(fitTop,350)};addEventListener('resize',fitTop);
})();
