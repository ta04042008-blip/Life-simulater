// 15-ui-faces-relation-map.js — 顔アイコン・関係の色、相関図（移動・拡大縮小・全体表示）
/* ---------- 顔アイコン・関係の色 ---------- */
const REL={'家族':['#d9503a','家族・親族'],'親族':['#d9503a','家族・親族'],'近所':['#2f9a67','近所・友人'],'友人':['#2f9a67','近所・友人'],'仲間':['#2f9a67','近所・友人'],
  '取引':['#2f78c9','取引・屋敷'],'邸の人':['#2f78c9','取引・屋敷'],'師':['#8a55c4','師'],
  '知人':['#2f9a67','近所・友人'],'隣人':['#2f9a67','近所・友人'],'仕事仲間':['#2f78c9','取引・屋敷'],'想い人':['#c4559f','想い人'],'地域の人':['#2f9a67','近所・友人'],'旅人':['#8a7a5a','その他'],'教え子':['#8a55c4','師'],'子ども':['#d9503a','家族・親族']};
const relCol=r=>(REL[r]||['#8a7a5a','その他'])[0];
const relGrp=r=>(REL[r]||['#8a7a5a','その他'])[1];
const hash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
const HAIRS=['#2a2230','#2a2420','#241f22','#4a3426','#1f1a1a'],CLOTHS=['#6a4f8f','#9a8a62','#4f6b88','#a3584a','#5f8a6a','#8a6f9a','#b08a4a'];
const FEMALE=/母|妹|姉|娘|祖母|女房|嫁/;
const faceCache={};
function faceURL(look,age,female,dead){
  const key=[look.hair,look.cloth,look.skin,age>=60?'g':age>=13?'a':age>=3?'c':'i',female?1:0].join('|');
  if(faceCache[key])return faceCache[key];
  const c=document.createElement('canvas');c.width=16;c.height=16;const x=c.getContext('2d');
  const r=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
  const ink='#3b2a14',hair=age>=60?'#c9c9c9':look.hair;
  const hy=age<3?5:age<13?4:3,hw=age<3?9:8,hx=Math.round((16-hw)/2),hh=7;
  const bw=age<13?8:10,bx=Math.round((16-bw)/2);
  r(ink,bx-1,hy+hh,bw+2,16-hy-hh);r(look.cloth,bx,hy+hh,bw,16-hy-hh);
  r(look.skin,7,hy+hh-1,2,1);
  r(ink,hx-1,hy-1,hw+2,hh+2);r(look.skin,hx,hy,hw,hh);
  r(hair,hx,hy,hw,2);r(hair,hx-1,hy+1,1,3);r(hair,hx+hw,hy+1,1,3);
  if(female&&age>=3){r(hair,hx-1,hy+1,2,hh+1);r(hair,hx+hw-1,hy+1,2,hh+1)}
  r('#1b1414',hx+2,hy+4,1,1);r('#1b1414',hx+hw-3,hy+4,1,1);
  r('#b0605a',7,hy+6,2,1);
  return faceCache[key]=c.toDataURL();
}
/* 人物アイコン：生活画面と同じ人物の絵（体＋髪）の全身を、1倍で表示する。絵が未読込のときだけ従来の簡易の顔を使う */
const sfCache={};
function spriteFace(w,age){
  const L=lookOf(w,age),urls=age<3?[L.baby]:[L.body,L.hair],ims=urls.map(spr);
  if(!ims.every(ok))return null;
  const key=urls.map(hash).join('|')+'|'+(age<3?'b':dropRows(age).join(','));
  if(sfCache[key])return sfCache[key];
  const c=document.createElement('canvas');c.width=64;c.height=64;const g=c.getContext('2d');
  if(age<3)g.drawImage(ims[0],0,0);
  else{const drops=dropRows(age),above=drops.filter(r=>r<57).length;layer(g,ims[0],drops,above,false);layer(g,ims[1],drops,above,false)}
  const d=g.getImageData(0,0,64,64).data;let top=-1,bot=-1,mn=64,mx=-1;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(d[(y*64+x)*4+3]>0){if(top<0)top=y;bot=y;mn=Math.min(mn,x);mx=Math.max(mx,x)}
  if(top<0)return null;
  /* 全身（影まで）を40×50の枠に、横は中央・足元は下揃えで置く（1倍＝生活画面と同じドット） */
  const o=document.createElement('canvas');o.width=40;o.height=50;
  const bw=mx-mn+1,bh=bot-top+1;
  o.getContext('2d').drawImage(c,mn,top,bw,bh,Math.round((40-bw)/2),50-bh,bw,bh);
  return sfCache[key]=o.toDataURL();
}
function selfFace(){return spriteFace({i:-1},S.age)||faceURL(PERSONAS[S.pid].look,S.age,false)}
function npcFace(n){
  {const ix=n.i!==undefined?n.i:S.npc.indexOf(n);const a=n.dead?(n.deadAge||60):npcAge(n);const f=ix>=0&&spriteFace({i:ix},a);if(f)return f}
  const h=hash(n.name+n.rel),sk=PERSONAS[S.pid].look.skin;
  return faceURL({hair:HAIRS[h%HAIRS.length],cloth:CLOTHS[(h>>>3)%CLOTHS.length],skin:sk},n.dead?(n.deadAge||60):npcAge(n),FEMALE.test(n.name+n.rel));
}
/* ---------- 相関図：カードを環状に並べ、関係名つきの矢印で結ぶ。移動・拡大縮小・全体表示ができる ---------- */
const MAP_CW=84;                                     // カードの幅（世界座標）
/* 人物同士の線の規則。あとから足す場合は、この配列に「(表示中の人物の一覧)→[{a,b,l,c,d}]」を返す関数を加えるだけ。
   a・b は S.npc の番号、l は関係名、c は色、d は破線（任意）。 */
const MAP_EDGE_RULES=[
  vis=>{                                             // 夫婦：父と母
    const f=vis.find(n=>n.role==='父'),m=vis.find(n=>n.role==='母');
    return f&&m?[{a:f.i,b:m.i,l:'夫婦',c:relCol('家族')}]:[];
  },
  vis=>{                                             // きょうだい：兄姉弟妹を、並んでいる順に結ぶ
    const sib=vis.filter(n=>/^(次|末)?(兄|姉|弟|妹)$/.test(n.role||''));
    return sib.slice(1).map((n,k)=>({a:sib[k].i,b:n.i,l:'きょうだい',c:relCol('家族'),d:1}));
  }
];
let mapView=null,mapSid=null,mapDragged=false;
const mapPtr=new Map();
function mapLayout(vis){                             // 世界座標に配置：自分が原点、近い人（好感度が高い順）ほど内側の輪
  const gOrder=[];vis.forEach(n=>{const g=relGrp(n.rel);if(!gOrder.includes(g))gOrder.push(g)});
  const ranked=vis.slice().sort((x,y)=>y.aff-x.aff);
  const rings=[];let k=0,left=ranked.slice();
  while(left.length){const R=150+140*k,cap=Math.max(6,Math.floor(2*Math.PI*R/110));rings.push({R,list:left.splice(0,cap)});k++}
  const pos={};
  rings.forEach((r,ri)=>{
    const l=r.list.slice().sort((x,y)=>gOrder.indexOf(relGrp(x.rel))-gOrder.indexOf(relGrp(y.rel)));
    l.forEach((n,j)=>{const a=-Math.PI/2+ri*0.35+j*(2*Math.PI/l.length);pos[n.i]={x:Math.round(r.R*Math.cos(a)),y:Math.round(r.R*Math.sin(a)*0.92)}});
  });
  return pos;
}
function mapBounds(pos){let x0=-50,x1=50,y0=-60,y1=60;for(const k in pos){const p=pos[k];x0=Math.min(x0,p.x-MAP_CW/2);x1=Math.max(x1,p.x+MAP_CW/2);y0=Math.min(y0,p.y-60);y1=Math.max(y1,p.y+60)}return{x0,x1,y0,y1}}
function mapApply(){
  const sv=$('mapsvg');if(!sv||!mapView)return;
  const r=sv.getBoundingClientRect();if(!r.width)return;
  const w=r.width/mapView.k,h=r.height/mapView.k;
  sv.setAttribute('viewBox',`${(mapView.cx-w/2).toFixed(1)} ${(mapView.cy-h/2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
}
function mapFit(pos){
  const sv=$('mapsvg'),r=sv.getBoundingClientRect(),b=mapBounds(pos);
  const k=Math.max(0.12,Math.min(1.4,Math.min(r.width/(b.x1-b.x0+40),r.height/(b.y1-b.y0+40))));
  mapView={cx:(b.x0+b.x1)/2,cy:(b.y0+b.y1)/2,k};
}
function mapZoom(f,px,py){                           // px,py：画面上の点（省略時は中央）を動かさずに拡大縮小
  const sv=$('mapsvg'),r=sv.getBoundingClientRect(),k0=mapView.k,k1=Math.max(0.12,Math.min(2.5,k0*f));
  if(px==null){px=r.left+r.width/2;py=r.top+r.height/2}
  const wx=mapView.cx+(px-r.left-r.width/2)/k0,wy=mapView.cy+(py-r.top-r.height/2)/k0;
  mapView.k=k1;mapView.cx=wx-(px-r.left-r.width/2)/k1;mapView.cy=wy-(py-r.top-r.height/2)/k1;mapApply();
}
function renderMap(){
  const vis=S.npc.map((n,i)=>({...n,i})).filter(visible);
  const sv=$('mapsvg');
  const pos=mapLayout(vis);
  if(mapSid!==S.lid||!mapView){                      // 人生が変わったら、見え方をつくり直す
    mapSid=S.lid;
    const r=sv.getBoundingClientRect();
    if(vis.length<=8)mapFit(pos);else mapView={cx:0,cy:0,k:Math.min(0.8,Math.max(0.12,r.width?r.width/460:0.8))};
  }
  const nm=n=>{const a=[...kz(String(n.name).replace('',''))],o=[];for(let i=0;i<a.length;i+=5)o.push(a.slice(i,i+5).join(''));return o.slice(0,2)};
  const H=n=>62+14*nm(n).length+14;
  const me={x:0,y:0,hw:MAP_CW/2,hh:48};
  const box=i=>i==='me'?me:{x:pos[i].x,y:pos[i].y,hw:MAP_CW/2,hh:H(vis.find(v=>v.i===i))/2};
  const clip=(A,B)=>{                                // A の枠から B の方向へ出る点
    const dx=B.x-A.x,dy=B.y-A.y;if(!dx&&!dy)return{x:A.x,y:A.y};
    const t=Math.min(dx?A.hw/Math.abs(dx):1e9,dy?A.hh/Math.abs(dy):1e9);return{x:A.x+dx*t,y:A.y+dy*t,dx,dy};
  };
  const arrow=(P,dx,dy,c)=>{                         // P に向かう矢じり（dx,dy は向き）
    const L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,s=7;
    return `<polygon points="${P.x.toFixed(1)},${P.y.toFixed(1)} ${(P.x-ux*s-uy*s*.55).toFixed(1)},${(P.y-uy*s+ux*s*.55).toFixed(1)} ${(P.x-ux*s+uy*s*.55).toFixed(1)},${(P.y-uy*s-ux*s*.55).toFixed(1)}" fill="${c}"/>`;
  };
  let lines='',labels='';
  const edge=(ia,ib,l,c,w,dash)=>{
    const A=box(ia),B=box(ib),pa=clip(A,B),pb=clip(B,A);
    lines+=`<line x1="${pa.x.toFixed(1)}" y1="${pa.y.toFixed(1)}" x2="${pb.x.toFixed(1)}" y2="${pb.y.toFixed(1)}" stroke="${c}" stroke-width="${w}"${dash?' stroke-dasharray="6 4"':''}/>`+arrow(pa,-(B.x-A.x),-(B.y-A.y),c)+arrow(pb,B.x-A.x,B.y-A.y,c);
    const mx=(pa.x+pb.x)/2,my=(pa.y+pb.y)/2,tw=[...l].length*13+10;
    labels+=`<g><rect x="${(mx-tw/2).toFixed(1)}" y="${(my-10).toFixed(1)}" width="${tw}" height="19" fill="var(--bg)" fill-opacity=".92"/><text x="${mx.toFixed(1)}" y="${(my+4).toFixed(1)}" text-anchor="middle" style="fill:${c}">${esc(kz(l))}</text></g>`;
  };
  vis.forEach(n=>edge('me',n.i,n.rel==='家族'&&n.role?n.role:n.rel,relCol(n.rel),(1.5+n.aff/25).toFixed(1),false));
  MAP_EDGE_RULES.forEach(f=>{try{f(vis).forEach(e=>{if(pos[e.a]&&pos[e.b])edge(e.a,e.b,e.l,e.c,1.5,e.d)})}catch(_){}});
  const card=(x,y,h,col,face,lines2,sub,attr)=>`<g class="node" ${attr} tabindex="0" role="button"><rect x="${x-MAP_CW/2}" y="${y-h/2}" width="${MAP_CW}" height="${h}" fill="var(--node)" stroke="${col}" stroke-width="3"/><image href="${face}" x="${x-20}" y="${y-h/2+4}" width="40" height="50" style="image-rendering:pixelated"/>${lines2.map((t,j)=>`<text x="${x}" y="${y-h/2+68+j*14}" text-anchor="middle">${esc(t)}</text>`).join('')}${sub}</g>`;
  let nodes=card(0,0,96,'var(--accent)',selfFace(),[kz(nameOf().replace('',''))],'',`data-prof="self" aria-label="自分のプロフィールを開く"`);
  vis.forEach(n=>{const p=pos[n.i],h=H(n);
    nodes+=card(p.x,p.y,h,relCol(n.rel),npcFace(n),nm(n),`<text x="${p.x}" y="${p.y-h/2+68+nm(n).length*14}" text-anchor="middle" style="fill:var(--accent)">♥${Math.round(n.aff)}</text>`,`data-prof="${n.i}" aria-label="${esc(kz(n.name))}のプロフィールを開く"`);});
  sv.innerHTML=lines+labels+nodes;
  mapApply();
  const grps=[];vis.forEach(n=>{const k=relGrp(n.rel);if(!grps.some(z=>z[0]===k))grps.push([k,relCol(n.rel)])});
  $('maplegend').innerHTML=grps.map(z=>`<span><i style="background:${z[1]}"></i>${esc(kz(z[0]))}</span>`).join('');
  const hid=S.npc.filter(n=>n.known&&!n.dead&&n.aff<10).length,unk=S.npc.filter(n=>!n.known).length,gone=S.npc.filter(n=>n.known&&n.dead).length;
  $('maphidden').textContent=kz(`好感度が低く非表示の人：${hid}人 ／ まだ知らない人：${unk}人 ／ 故人：${gone}人`);
}
(function mapControls(){                             // ドラッグで移動、ピンチ・ホイールで拡大縮小、ボタンで全体表示
  const sv=$('mapsvg');
  sv.addEventListener('pointerdown',e=>{mapPtr.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY});if(mapPtr.size===1)mapDragged=false});
  sv.addEventListener('pointermove',e=>{
    const p=mapPtr.get(e.pointerId);if(!p||!mapView)return;
    if(mapPtr.size===1){
      const dx=e.clientX-p.x,dy=e.clientY-p.y;
      if(!mapDragged&&Math.hypot(e.clientX-p.x0,e.clientY-p.y0)>6){mapDragged=true;try{sv.setPointerCapture(e.pointerId)}catch(_){}}   /* 動かし始めてから捕まえる（タップはカードにそのまま届く） */
      if(mapDragged){mapView.cx-=dx/mapView.k;mapView.cy-=dy/mapView.k;mapApply()}
      p.x=e.clientX;p.y=e.clientY;
    }else if(mapPtr.size===2){
      const o=[...mapPtr.entries()].find(([id])=>id!==e.pointerId)[1];
      const d0=Math.hypot(p.x-o.x,p.y-o.y),n={x:e.clientX,y:e.clientY},d1=Math.hypot(n.x-o.x,n.y-o.y);
      mapDragged=true;try{sv.setPointerCapture(e.pointerId)}catch(_){}p.x=n.x;p.y=n.y;
      if(d0>0)mapZoom(d1/d0,(n.x+o.x)/2,(n.y+o.y)/2);
    }
  });
  const up=e=>{mapPtr.delete(e.pointerId)};
  sv.addEventListener('pointerup',up);sv.addEventListener('pointercancel',up);
  sv.addEventListener('wheel',e=>{if(!mapView)return;e.preventDefault();mapZoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY)},{passive:false});
  sv.addEventListener('click',e=>{if(mapDragged){e.stopPropagation();e.preventDefault();mapDragged=false}},true);
  const vis=()=>S.npc.map((n,i)=>({...n,i})).filter(visible);
  $('mzin').onclick=()=>mapZoom(1.3);$('mzout').onclick=()=>mapZoom(1/1.3);
  $('mfit').onclick=()=>{mapFit(mapLayout(vis()));mapApply()};
  $('mme').onclick=()=>{mapView.cx=0;mapView.cy=0;mapView.k=Math.max(mapView.k,0.8);mapApply()};
})();

