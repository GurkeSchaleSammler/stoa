export const BOARD_UI_URI = "ui://stoasis/board.html";

export const BOARD_UI_HTML = String.raw`<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    :root{color-scheme:light dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;--paper:#f4f1e8;--card:#fffdf7;--ink:#26352d;--muted:#6e7a72;--line:#d7d5ca;--accent:#56705d;--sage:#9eb29a;--clay:#c88e71;--amber:#d6a448}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink)}
    .shell{padding:14px}.header{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:12px}.title{display:flex;gap:10px;align-items:center}.emoji{width:38px;height:38px;border-radius:12px;background:var(--card);display:grid;place-items:center;border:1px solid var(--line);font-size:20px}.header h1{font-size:18px;margin:0 0 3px}.header p{font-size:12px;color:var(--muted);margin:0}.open{border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);padding:8px 10px;text-decoration:none;font-size:12px;font-weight:700;white-space:nowrap}
    .stats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.stat{background:#ffffff90;border:1px solid var(--line);border-radius:999px;padding:4px 8px;font-size:11px;color:var(--muted)}
    .viewport{overflow:auto;max-height:620px;border:1px solid var(--line);border-radius:16px;background-color:#ebe8df;background-image:radial-gradient(#9aa59d55 1px,transparent 1px);background-size:14px 14px;box-shadow:inset 0 0 40px #59655c10}.board{position:relative;min-width:100%;min-height:340px}.empty{padding:80px 24px;text-align:center;color:var(--muted)}
    .element{position:absolute}.zone{border:1.5px dashed color-mix(in srgb,var(--zone) 65%,transparent);background:color-mix(in srgb,var(--zone) 14%,transparent);border-radius:14px;padding:7px;font-size:10px;color:var(--ink);z-index:1}.pin{background:var(--card);border:1px solid #cbc9bd;border-radius:11px;padding:8px;overflow:hidden;box-shadow:0 5px 15px #26352d18;z-index:10}.pin .kind{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:5px}.pin .content{font-size:11px;font-weight:720;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}.pin .tags{font-size:9px;color:var(--accent);margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stack{background:linear-gradient(145deg,var(--card),#e9eee6);border:2px solid var(--accent);border-radius:12px;padding:8px;box-shadow:5px 5px 0 #738a7860,10px 10px 0 #738a7825;z-index:11}.stack .stack-title{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);margin-bottom:5px}.stack .child{font-size:10px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:3px 0}.label{font-size:12px;font-weight:800;line-height:1.1;z-index:14;overflow:hidden}.sticker{display:grid;place-items:center;font-size:18px;color:var(--sticker);z-index:13;filter:drop-shadow(0 3px 3px #26352d22)}svg{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:visible}.connector{fill:none;stroke-linecap:round;stroke-width:2;stroke-dasharray:4 3;opacity:.82}
    @media(prefers-color-scheme:dark){:root{--paper:#17201b;--card:#263229;--ink:#edf3ee;--muted:#b1bdb4;--line:#455249}.viewport{background-color:#1c2821;background-image:radial-gradient(#7e908250 1px,transparent 1px)}.stat{background:#263229}.pin{border-color:#4b584f}.stack{background:linear-gradient(145deg,#263229,#1d2922)}}
  </style>
</head>
<body><main class="shell"><div id="root"><div class="empty">Board wird geladen …</div></div></main>
<script>
(() => {
  const root = document.getElementById("root");
  const colors = {accent:"#56705d",sage:"#7f9b7c",clay:"#bd7658",ink:"#34443b",amber:"#c8942e"};
  const motifs = {circle:"●",triangle:"▲",moon:"☾",blob:"✦",star:"★",wave:"≈",arrow:"➜",leaf:"❧",cloud:"☁",drop:"◆",compass:"✥",suitcase:"▣",camera:"▤"};
  const el = (tag, className, text) => { const node=document.createElement(tag); if(className) node.className=className; if(text!==undefined) node.textContent=String(text); return node; };
  const pinTitle = (pin) => { const d=pin.data||{}; return d.title||d.content||d.caption||d.skillName||d.url||pin.id; };
  const kindLabel = (type) => ({link:"Link",note:"Notiz",photo:"Foto",skill:"Skill"}[type]||type);
  function render(value){
    const snapshot=value?.snapshot||value;
    if(!snapshot?.board){ root.replaceChildren(el("div","empty","Kein Board verfügbar.")); return; }
    root.replaceChildren();
    const header=el("header","header"), title=el("div","title"), emoji=el("div","emoji",snapshot.board.emoji||"📌"), titleText=el("div");
    titleText.append(el("h1",null,snapshot.board.name),el("p",null,(snapshot.board.currentUserRole||"viewer")+" · "+snapshot.board.visibility)); title.append(emoji,titleText);
    const open=el("a","open","In Stoasis öffnen ↗"); open.href=snapshot.board.url; open.target="_blank"; open.rel="noopener noreferrer"; open.onclick=(event)=>{ if(window.openai?.openExternal){ event.preventDefault(); window.openai.openExternal({href:snapshot.board.url}); } }; header.append(title,open); root.append(header);
    const stats=el("div","stats"); Object.entries(snapshot.counts||{}).forEach(([key,count])=>stats.append(el("span","stat",count+" "+({pins:"Pins",stacks:"Stacks",connectors:"Verbindungen",zones:"Zonen",labels:"Labels",stickers:"Sticker"}[key]||key)))); root.append(stats);
    const viewport=el("div","viewport"), board=el("div","board"); viewport.append(board); root.append(viewport);
    const occ=snapshot.bounds?.occupied; if(!occ){ board.append(el("div","empty","Dieses Board ist noch leer.")); return; }
    const minX=Math.max(0,Math.floor(occ.minX)-4), minY=Math.max(0,Math.floor(occ.minY)-4), maxX=Math.min(160,Math.ceil(occ.maxX)+4), maxY=Math.min(240,Math.ceil(occ.maxY)+4);
    const clipWidth=Math.max(48,maxX-minX), clipHeight=Math.max(36,maxY-minY); const scale=Math.max(3.2,Math.min(7,(viewport.clientWidth-24)/clipWidth));
    board.style.width=(clipWidth*scale)+"px"; board.style.height=(clipHeight*scale)+"px";
    const place=(node,x,y,w,h,layer) => { node.classList.add("element"); node.style.left=((x-minX)*scale)+"px"; node.style.top=((y-minY)*scale)+"px"; node.style.width=(w*scale)+"px"; node.style.height=(h*scale)+"px"; if(layer!==undefined) node.style.zIndex=String(10+layer); board.append(node); };
    (snapshot.elements?.zones||[]).forEach(z=>{ const n=el("div","zone",z.label||""); n.style.setProperty("--zone",colors[z.colorVariant]||colors.sage); place(n,z.x,z.y,z.widthClips,z.heightClips,0); });
    const pinById=Object.fromEntries((snapshot.pins||[]).map(p=>[p.id,p])); const stackByPin=snapshot.relationships?.stackByPinId||{};
    (snapshot.pins||[]).filter(p=>!stackByPin[p.id]).forEach(p=>{ const n=el("article","pin"); n.append(el("div","kind",kindLabel(p.type)),el("div","content",pinTitle(p))); if(p.tags?.length)n.append(el("div","tags",p.tags.join(" · "))); place(n,p.grid.x,p.grid.y,p.grid.width||16,p.grid.heightClips,p.grid.layer); });
    const stacksById={}; (snapshot.elements?.stacks||[]).forEach(s=>{ stacksById[s.id]=s; const n=el("article","stack"); n.append(el("div","stack-title","Stack · "+s.children.length+" Pins")); s.children.slice(0,5).forEach(id=>n.append(el("div","child",pinTitle(pinById[id]||{id,data:{}})))); place(n,s.x,s.y,s.width||16,s.heightClips,s.layer); });
    (snapshot.elements?.labels||[]).forEach(l=>place(el("div","label",l.text),l.x,l.y,l.widthClips,4,l.layer));
    (snapshot.elements?.stickers||[]).forEach(s=>{ const n=el("div","sticker",motifs[s.motif]||"✦"); n.style.setProperty("--sticker",colors[s.colorVariant]||colors.accent); n.style.transform="rotate("+s.rotation+"deg)"; place(n,s.x,s.y,s.widthClips,s.heightClips,s.layer); });
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.setAttribute("width",String(clipWidth*scale)); svg.setAttribute("height",String(clipHeight*scale));
    const center=(id)=>{ const stackId=stackByPin[id], item=stackId?stacksById[stackId]:pinById[id]; if(!item)return null; const grid=item.grid||item; return {x:(grid.x-minX+(grid.width||16)/2)*scale,y:(grid.y-minY+grid.heightClips/2)*scale}; };
    (snapshot.elements?.connectors||[]).forEach(c=>{ const a=center(c.sourcePinId),b=center(c.targetPinId); if(!a||!b)return; const path=document.createElementNS("http://www.w3.org/2000/svg","path"); const bend=Math.max(10,Math.abs(b.x-a.x)*.35); path.setAttribute("d","M "+a.x+" "+a.y+" C "+(a.x+bend)+" "+a.y+", "+(b.x-bend)+" "+b.y+", "+b.x+" "+b.y); path.setAttribute("class","connector"); path.setAttribute("stroke",colors[c.colorVariant]||colors.accent); svg.append(path); }); board.prepend(svg);
  }
  window.addEventListener("message",event=>{ if(event.source!==window.parent)return; const message=event.data; if(message?.jsonrpc!=="2.0")return; if(message.method==="ui/notifications/tool-result")render(message.params?.structuredContent); },{passive:true});
  if(window.openai?.toolOutput) render(window.openai.toolOutput);
})();
</script></body></html>`;
