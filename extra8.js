/* Arcane Reads v2.0 — rediseño visual + nivel de lector, racha, libro sugerido */
(function(){
const dk=()=>{try{const m=getComputedStyle(document.body).backgroundColor.match(/\d+/g)||[20,20,40];const l=(.299*m[0]+.587*m[1]+.114*m[2])/255;document.body.classList.toggle('is-dark',l<.45)}catch{}};
const _r=render;render=function(){_r();dk();requestAnimationFrame(dk)};
const TITLES=['Aprendiz de letras','Exploradora de páginas','Guardiana de tomos','Hechicera de páginas','Archimaga','Custodia arcana','Oráculo de la biblioteca'];
const day=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
function stats(){
  const ss=data.sessions||[],pages=ss.reduce((a,s)=>a+(+s.pages||0),0),done=data.books.filter(b=>b.status==='Leído').length;
  const xp=pages+done*50,lv=Math.floor(Math.sqrt(xp/50))+1,lo=50*(lv-1)**2,hi=50*lv**2;
  const set=new Set(ss.map(s=>s.date)),d=new Date();if(!set.has(day(d)))d.setDate(d.getDate()-1);
  let streak=0;while(set.has(day(d))){streak++;d.setDate(d.getDate()-1)}
  const wk=new Date();wk.setDate(wk.getDate()-6);const wpages=ss.filter(s=>s.date>=day(wk)).reduce((a,s)=>a+(+s.pages||0),0);
  return{xp,lv,pct:Math.round((xp-lo)/(hi-lo)*100),next:hi-xp,streak,wpages,title:TITLES[Math.min(lv-1,TITLES.length-1)]};
}
function pick(){const l=data.books.filter(b=>b.status==='Por leer');if(!l.length)return null;const k=Math.floor(Date.now()/864e5);return l[k%l.length]}
const _rh=renderHome;renderHome=function(){
  const w=_rh(),s=stats(),b=pick(),box=document.createElement('div');
  box.innerHTML=`<section class="card rdr"><div class="rdr-ring" style="--p:${s.pct}"><b>${s.lv}</b><small>nivel</small></div>
   <div class="rdr-t"><strong>${s.title}</strong><span>${s.xp} XP · faltan ${s.next} para el nivel ${s.lv+1}</span>
   <div class="rdr-chips"><i>🔥 ${s.streak} día${s.streak===1?'':'s'} de racha</i><i>📖 ${s.wpages} págs esta semana</i></div></div></section>
   ${b?`<button class="card tonight" onclick="bookDetails('${b.id}')"><div class="hcov">${coverHtml(b)}</div><div><span>Esta noche podrías leer…</span><strong>${esc(b.title)}</strong><em>${esc(b.author||'')}</em></div></button>`:''}`;
  const at=w.children[1]||null;[...box.children].forEach(c=>w.insertBefore(c,at));return w;
};
dk();
})();
