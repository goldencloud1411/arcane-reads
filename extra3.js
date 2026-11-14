/* Arcane Reads v1.0 — lomo curvo, lomo automático con título, íconos arcanos, descripciones */
const ICONS={compass:'<circle cx="12" cy="5" r="1.7"/><path d="M12 6.7 6 20.5M12 6.7l6 13.8M8.4 15h7.2"/>',
 shelf:'<path d="M3 20.5h18"/><rect x="4.5" y="6" width="3.6" height="14.5" rx=".8"/><rect x="9.6" y="3.5" width="3.6" height="17" rx=".8"/><path d="M15.4 20.5 14.8 8.6l3.4-.7 2.2 12.2"/>',
 flask:'<path d="M9.5 3h5M10.5 3v6.2L5.6 18a2 2 0 0 0 1.7 3h9.4a2 2 0 0 0 1.7-3l-4.9-8.8V3"/><path d="M8 15h8"/>',
 eye:'<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><path d="M12 9l.9 2.1L15 12l-2.1.9L12 15l-.9-2.1L9 12l2.1-.9z"/>',
 spark:'<path d="M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>',
 scroll:'<path d="M8 4h10a1 1 0 0 1 1 1v12a3 3 0 0 1-3 3H7a3 3 0 0 0 3-3V6a2 2 0 0 0-2-2zm0 0a2 2 0 0 0-2 2v1h4"/><path d="M13 9h4M13 12h4"/>',
 quill:'<path d="M20 4c-7 0-12 4-13 11l-2 5 5-2c7-1 11-6 10-14z"/><path d="M7 15l8-6"/>',
 hourglass:'<path d="M7 3h10M7 21h10M8 3c0 5 4 6 4 9s-4 4-4 9M16 3c0 5-4 6-4 9s4 4 4 9"/>',
 mark:'<path d="M7 3h10v18l-5-4-5 4z"/><path d="M12 7l.8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3z"/>',
 frame:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 16l5-4.5 4 3.5 3-2.5 5 4"/><circle cx="16.5" cy="9.5" r="1.3"/>',
 forbid:'<circle cx="12" cy="12" r="8.5"/><path d="M7 12h10"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* lomo automático: título ajustado, autor y filetes dorados */
const _as=new Map();
function autoSpine(b){const key=[b.title,b.author,b.color,b.height,b.thick].join('|');if(_as.has(key))return _as.get(key);
  const h=Math.max(.1,b.height||22),t=Math.max(.1,b.thick||3),PX=44,Wc=Math.round(Math.max(70,t*PX)),Hc=Math.round(h*PX),col=b.color||'#7b5472';
  const cv=document.createElement('canvas');cv.width=Wc;cv.height=Hc;const x=cv.getContext('2d');x.fillStyle=col;x.fillRect(0,0,Wc,Hc);
  const n=parseInt(col.slice(1),16)||0,lum=.299*(n>>16)+.587*((n>>8)&255)+.114*(n&255),ink=lum>150?'#2a1d1a':'#f6ecda',gold=lum>150?'#6e4f1f':'#d7ae57';
  x.translate(Wc/2,0);x.rotate(Math.PI/2);const p=Hc*.07,Lt=Hc*.6,F=s=>`700 ${s}px "Cormorant Garamond",Georgia,serif`;
  x.fillStyle=gold;[p*.55,Hc-p*.55,p*.55+7,Hc-p*.55-7].forEach((v,i)=>x.fillRect(v,-Wc/2,i<2?3:1.5,Wc));
  const words=String(b.title||'Sin título').split(/\s+/),wrap=k=>{const tot=words.join(' ').length,out=[];let cur='';words.forEach(w=>{if(cur&&(cur+' '+w).length>tot/k&&out.length<k-1){out.push(cur);cur=w}else cur=cur?cur+' '+w:w});out.push(cur);return out};
  let best=null;for(let k=1;k<=3;k++){const L=wrap(k);let s=Math.min(Wc*.62,Wc*.8/(k*1.12));for(;s>8;s-=2){x.font=F(s);if(L.every(l=>x.measureText(l).width<=Lt))break}if(!best||s>best.s+3)best={s,L}}
  x.fillStyle=ink;x.textAlign='center';x.textBaseline='middle';x.font=F(best.s);const cx=p+Lt/2;
  best.L.forEach((l,i)=>x.fillText(l,cx,(i-(best.L.length-1)/2)*best.s*1.12));
  if(b.author){let s=Wc*.2;x.fillStyle=gold;x.textAlign='center';for(;s>7;s-=1){x.font=F(s);if(x.measureText(b.author).width<=Hc*.15)break}x.fillText(b.author,Hc*.84,0)}
  const u=cv.toDataURL('image/png');_as.set(key,u);return u}
document.fonts?.load('700 20px "Cormorant Garamond"').then(()=>{_as.clear();try{render()}catch{}}).catch(()=>{});
const _sbh2=shelfBookHtml;shelfBookHtml=function(b){return(b.display==='Lomo'||!b.display)&&!b.spine?_sbh2({...b,spine:autoSpine(b)}):_sbh2(b)};

/* libro 3D con lomo curvo */
function build3D(c){const b=draft,H=Math.min(220,Math.max(72,(b.height||22)*8)),W=H*Math.max(.28,Math.min(1.2,(b.width||14)/(b.height||22))),D=Math.max(12,Math.min(90,H*(b.thick||3)/(b.height||22))),col=b.color||'#7b5472',ec=b.edgeColor||'#e6dbc7';
  c.style.cssText=`width:${W}px;height:${H}px`;c.style.setProperty('--sp',`url(${b.spine||autoSpine(b)})`);
  const fc=(src,txt,st,bg)=>`<div class="face" style="${st};background-color:${bg}${src?`;background-image:url(${src});background-size:100% 100%`:''}">${src?'':`<span>${esc(txt||'')}</span>`}</div>`;
  const bl=Math.min(D*.34,10),K=12,P=[];for(let i=0;i<=K;i++){const f=-Math.PI/2+Math.PI*i/K;P.push([-W/2-bl*Math.cos(f),D/2*Math.sin(f)])}
  let L=0;const seg=[];for(let i=0;i<K;i++){const tx=P[i+1][0]-P[i][0],tz=P[i+1][1]-P[i][1],s=Math.hypot(tx,tz);seg.push({tx,tz,s,cx:(P[i][0]+P[i+1][0])/2,cz:(P[i][1]+P[i+1][1])/2});L+=s}
  let off=0,sp='';seg.forEach((g,i)=>{const th=Math.atan2(-g.tz,g.tx)*180/Math.PI,f=Math.abs(-Math.PI/2+Math.PI*(i+.5)/K),sh=(.42*Math.pow(f/(Math.PI/2),2.2)).toFixed(2);
    sp+=`<div class="face" style="left:${(W-g.s)/2}px;top:0;width:${g.s+.8}px;height:${H}px;transform:translate3d(${g.cx}px,0,${g.cz}px) rotateY(${th}deg);border:0;background-color:${col};background-image:linear-gradient(rgba(0,0,0,${sh}),rgba(0,0,0,${sh})),var(--sp);background-size:100% 100%,${L}px ${H}px;background-position:0 0,-${off}px 0"></div>`;off+=g.s});
  c.innerHTML=fc(b.cover,b.title,`width:${W}px;height:${H}px;transform:translateZ(${D/2}px);border-radius:0 4px 4px 0`,col)+fc(b.back,b.author,`width:${W}px;height:${H}px;transform:rotateY(180deg) translateZ(${D/2}px)`,col)+sp
   +fc(b.edge,'',`width:${D}px;height:${H}px;left:${(W-D)/2}px;transform:rotateY(90deg) translateZ(${W/2}px)`,ec)
   +fc(b.top,'',`width:${W}px;height:${D}px;top:${(H-D)/2}px;transform:rotateX(90deg) translateZ(${H/2}px)`,ec)+fc(b.bottom,'',`width:${W}px;height:${D}px;top:${(H-D)/2}px;transform:rotateX(-90deg) translateZ(${H/2}px)`,ec)}
let _ck='';
drawCube=function(){const c=$('cube');if(!c||!draft)return;
  if(draft.display==='Apilado'){const{n,T,L}=stackDims(draft);c.style.cssText=`width:${L+14}px;height:${n*T}px;display:flex;flex-direction:column;justify-content:flex-end;transform:rotateX(8deg) rotateY(-10deg)`;c.innerHTML=stackLayers(draft,L,T,n);c.dataset.b3='';return}
  const k=[draft.display,draft.title,draft.author,draft.color,draft.edgeColor,draft.height,draft.width,draft.thick,['cover','back','spine','edge','top','bottom'].map(f=>(draft[f]||'').length).join()].join('|');
  if(k!==_ck||c.dataset.b3!=='1'){build3D(c);c.dataset.b3='1';_ck=k}
  c.style.transform=`rotateX(6deg) rotateY(${cubeAngle}deg)`};

/* descripciones: Goodreads (ficha de la edición) → Google Books → Open Library */
const PX=[x=>'https://corsproxy.io/?url='+encodeURIComponent(x),x=>'https://api.allorigins.win/raw?url='+encodeURIComponent(x)];
async function proxyText(u){for(const p of PX){try{const r=await fetch(p(u));if(r.ok){const t=await r.text();if(t.length>500)return t}}catch{}}return''}
async function grInfo(url){const out={description:'',pages:0};try{const html=await proxyText(url);if(!html)return out;const doc=new DOMParser().parseFromString(html,'text/html');let d='';
  try{const st=JSON.parse(doc.getElementById('__NEXT_DATA__').textContent).props.pageProps.apolloState;for(const k in st){const o=st[k];if(o&&o.__typename==='Book')for(const f in o)if(f.startsWith('description')&&typeof o[f]==='string'&&o[f].length>d.length)d=o[f]}}catch{}
  if(!d)d=doc.querySelector('meta[property="og:description"]')?.content||'';
  try{out.pages=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent).numberOfPages||0}catch{}
  out.description=stripHtml(d.replace(/<br\s*\/?>/gi,'\n')).trim()}catch{}return out}
async function gbInfo(b){for(const lr of['es','']){try{const q=b.isbn?'isbn:'+b.isbn:`intitle:${b.title}${b.author?' inauthor:'+b.author:''}`,j=await(await fetch('https://www.googleapis.com/books/v1/volumes?maxResults=1'+(lr&&!b.isbn?'&langRestrict='+lr:'')+'&q='+encodeURIComponent(q))).json(),v=j.items?.[0]?.volumeInfo;if(v&&(v.description||!lr))return v}catch{}}return null}
async function olDesc(b){try{const j=await(await fetch('https://openlibrary.org/search.json?limit=1&fields=key&q='+encodeURIComponent(b.title+' '+(b.author||'')))).json(),k=j.docs?.[0]?.key;if(!k)return'';const w=await(await fetch('https://openlibrary.org'+k+'.json')).json(),d=w.description;return stripHtml(typeof d==='string'?d:d?.value||'')}catch{return''}}
enrich=async function(b){if(!b||(b.description&&b.pages&&b.publisher))return;
  const set=(k,x)=>{if(!x)return;if(!b[k])b[k]=x;if(draft&&draft.id===b.id&&!draft[k])draft[k]=x};
  if(!b.description&&b.goodreadsUrl){const g=await grInfo(b.goodreadsUrl);set('description',g.description);set('pages',g.pages)}
  const v=(!b.description||!b.pages||!b.publisher)?await gbInfo(b):null;
  if(v){set('description',stripHtml(v.description||''));set('pages',v.pageCount);set('publisher',v.publisher);set('year',String(v.publishedDate||'').slice(0,4));set('categories',(v.categories||[]).join(', '));set('isbn',(v.industryIdentifiers||[]).find(i=>i.type==='ISBN_13')?.identifier)}
  if(!b.description)set('description',await olDesc(b));
  b.descTried=Date.now();save();const ta=document.querySelector('#secBasic textarea');if(ta&&draft&&draft.id===b.id&&!ta.value)ta.value=draft.description||''};
let _ea=false;async function enrichAll(){if(_ea||!navigator.onLine)return;_ea=true;let n=0;for(const b of data.books){if(b.description||(b.descTried&&Date.now()-b.descTried<6048e5))continue;if(++n>25)break;await enrich(b);await new Promise(r=>setTimeout(r,500))}_ea=false}
setTimeout(enrichAll,4000);addEventListener('online',()=>setTimeout(enrichAll,1500));
