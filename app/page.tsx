"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "solo" | "local" | "online";
type Hero = { id:number; name:string; icon:string; color:string; x:number; y:number; hp:number; actions:number; kills:number; xp:number; weapon:string; range:number; damage:number };
type Zombie = { id:number; kind:"walker"|"runner"|"brute"; x:number; y:number; hp:number };
type Game = { heroes:Hero[]; zombies:Zombie[]; active:number; round:number; danger:number; objectives:string[]; searched:string[]; log:string[]; status:"playing"|"won"|"lost"; mode:Mode };

const W=8,H=6;
const walls = new Set(["2,0","2,1","5,0","5,1","1,3","2,3","5,3","6,3"]);
const buildings = new Set(["0,0","1,0","0,1","1,1","3,0","4,0","3,1","4,1","6,0","7,0","6,1","7,1","0,3","0,4","1,4","2,4","3,3","3,4","4,3","4,4","5,4","6,4","7,3","7,4"]);
const crates = ["0,0","4,1","0,4","4,4","7,4"];
const exits = new Set(["7,2"]);
const spawn = [{x:0,y:2},{x:7,y:5}];
const heroSeeds=[
  ["Maya","⚡","#ffc83d","Machete",0,2],
  ["Duke","🛡","#58d6ff","Shotgun",2,2],
  ["Rook","🎯","#fd6c85","Rifle",3,1],
  ["Doc","✚","#9bea72","Pistol",2,1],
] as const;
const loot=["Shotgun","Katana","Rifle","Fire Axe","Medkit","Chainsaw"];
const zIcon={walker:"🧟",runner:"👹",brute:"☠"};

function fresh(mode:Mode):Game{
 return {mode,round:1,danger:1,active:0,status:"playing",objectives:["0,0","4,1","4,4"],searched:[],log:["The sirens died hours ago. Reach the evac zone!"],
 heroes:heroSeeds.map((h,i)=>({id:i,name:h[0],icon:h[1],color:h[2],x:3,y:2,hp:3,actions:3,kills:0,xp:0,weapon:h[3],range:h[4],damage:h[5]})),
 zombies:[{id:1,kind:"walker",x:1,y:2,hp:1},{id:2,kind:"walker",x:6,y:2,hp:1},{id:3,kind:"runner",x:7,y:4,hp:1}]};
}

export default function Home(){
 const [screen,setScreen]=useState<"menu"|"rules"|"game"|"connect">("menu");
 const [game,setGame]=useState<Game>(()=>fresh("solo"));
 const [selected,setSelected]=useState<{x:number,y:number}|null>(null);
 const [toast,setToast]=useState("");
 const [sound,setSound]=useState(true);
 const [onlineRole,setOnlineRole]=useState<"host"|"guest">("host");
 const [offer,setOffer]=useState(""); const [answer,setAnswer]=useState(""); const [connected,setConnected]=useState(false);
 const peer=useRef<RTCPeerConnection|null>(null); const channel=useRef<RTCDataChannel|null>(null);
 const hero=game.heroes[game.active];
 const ping=(s:string)=>{setToast(s); setTimeout(()=>setToast(""),1800)};
 const send=(g:Game)=>{if(channel.current?.readyState==="open")channel.current.send(JSON.stringify(g))};
 const commit=(fn:(g:Game)=>Game)=>setGame(old=>{const n=fn(structuredClone(old)); send(n); localStorage.setItem("deadzone-save",JSON.stringify(n)); return n});

 useEffect(()=>{ const saved=localStorage.getItem("deadzone-save"); if(saved) try{setGame(JSON.parse(saved))}catch{} },[]);
 const start=(mode:Mode)=>{setGame(fresh(mode)); setScreen(mode==="online"?"connect":"game")};
 const log=(g:Game,s:string)=>{g.log=[s,...g.log].slice(0,7)};
 const blocked=(x:number,y:number)=>x<0||y<0||x>=W||y>=H||walls.has(`${x},${y}`);
 const dist=(a:{x:number,y:number},b:{x:number,y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

 function clickCell(x:number,y:number){
  if(game.status!=="playing"||hero.actions<1||blocked(x,y))return;
  const d=dist(hero,{x,y}); const target=game.zombies.find(z=>z.x===x&&z.y===y);
  if(target && d<=Math.max(1,hero.range)){attack(target.id);return}
  if(d===1&&!game.zombies.some(z=>z.x===x&&z.y===y)) commit(g=>{const h=g.heroes[g.active];h.x=x;h.y=y;h.actions--;log(g,`${h.name} moves to ${x+1}-${y+1}.`);return g});
  else {setSelected({x,y});ping(target?"Target out of range":"Move one zone at a time")}
 }
 function attack(id:number){commit(g=>{const h=g.heroes[g.active], z=g.zombies.find(v=>v.id===id);if(!z)return g;h.actions--;z.hp-=h.damage;log(g,`${h.name} attacks with ${h.weapon}!`);if(z.hp<=0){g.zombies=g.zombies.filter(v=>v.id!==id);h.kills++;h.xp++;g.danger=1+Math.floor(g.heroes.reduce((n,v)=>n+v.xp,0)/5);log(g,`${z.kind.toUpperCase()} DOWN!`)}return g});ping("WHAM!")}
 function search(){const key=`${hero.x},${hero.y}`;if(hero.actions<1||!buildings.has(key))return ping("Search inside a building");if(game.searched.includes(key))return ping("This room is empty");commit(g=>{const h=g.heroes[g.active];h.actions--;g.searched.push(key);const item=loot[(g.round+h.id+g.searched.length)%loot.length];h.weapon=item;h.range=item==="Rifle"?3:item==="Shotgun"||item==="Pistol"?2:0;h.damage=item==="Chainsaw"?2:1;log(g,`${h.name} found a ${item}!`);if(g.objectives.includes(key)){g.objectives=g.objectives.filter(o=>o!==key);h.xp+=2;log(g,"SUPPLY CACHE SECURED!")}return g});ping("Loot found!")}
 function heal(){if(hero.weapon!=="Medkit"||hero.actions<1)return ping("You need a Medkit");commit(g=>{const h=g.heroes[g.active];h.actions--;h.hp=Math.min(3,h.hp+2);h.weapon="Pistol";h.range=2;log(g,`${h.name} patches up.`);return g})}
 function endTurn(){commit(g=>{g.heroes[g.active].actions=0;let next=g.active+1;if(next<g.heroes.length){g.active=next;g.heroes[next].actions=3;log(g,`${g.heroes[next].name}'s turn.`);return g}return zombiePhase(g)});}
 function zombiePhase(g:Game){log(g,"— ZOMBIE PHASE —");for(const z of g.zombies){const alive=g.heroes.filter(h=>h.hp>0);if(!alive.length)break;alive.sort((a,b)=>dist(z,a)-dist(z,b));const t=alive[0],steps=z.kind==="runner"?2:1;for(let n=0;n<steps;n++){if(dist(z,t)===0){t.hp--;log(g,`${t.name} is bitten!`);break}const opts=[[z.x+1,z.y],[z.x-1,z.y],[z.x,z.y+1],[z.x,z.y-1]].filter(([x,y])=>!blocked(x,y)).sort((a,b)=>dist({x:a[0],y:a[1]},t)-dist({x:b[0],y:b[1]},t));z.x=opts[0][0];z.y=opts[0][1]}}
  let id=Math.max(0,...g.zombies.map(z=>z.id))+1;for(const s of spawn){const count=Math.min(3,g.danger);for(let i=0;i<count;i++)g.zombies.push({id:id++,kind:g.round%4===0?"brute":g.round%3===0?"runner":"walker",x:s.x,y:s.y,hp:g.round%4===0?2:1})}
  g.heroes=g.heroes.filter(h=>h.hp>0);g.round++;g.active=0;g.heroes.forEach(h=>h.actions=3);if(!g.heroes.length)g.status="lost";else if(!g.objectives.length&&g.heroes.every(h=>exits.has(`${h.x},${h.y}`)))g.status="won";else log(g,`ROUND ${g.round} — ${g.zombies.length} infected roam.`);return g;
 }
 function connectSetup(role:"host"|"guest"){setOnlineRole(role);setOffer("");setAnswer("");setConnected(false);setScreen("connect")}
 const waitIce=(pc:RTCPeerConnection)=>new Promise<void>(res=>{if(pc.iceGatheringState==="complete")res();else pc.onicegatheringstatechange=()=>pc.iceGatheringState==="complete"&&res()});
 function wire(dc:RTCDataChannel){channel.current=dc;dc.onopen=()=>{setConnected(true);ping("Survivors linked!");if(onlineRole==="host")send(game)};dc.onmessage=e=>{try{setGame(JSON.parse(e.data));setScreen("game")}catch{}};dc.onclose=()=>setConnected(false)}
 async function makeOffer(){const pc=new RTCPeerConnection();peer.current=pc;wire(pc.createDataChannel("deadzone"));await pc.setLocalDescription(await pc.createOffer());await waitIce(pc);setOffer(btoa(JSON.stringify(pc.localDescription)));}
 async function acceptOffer(){try{const pc=new RTCPeerConnection();peer.current=pc;pc.ondatachannel=e=>wire(e.channel);await pc.setRemoteDescription(JSON.parse(atob(offer.trim())));await pc.setLocalDescription(await pc.createAnswer());await waitIce(pc);setAnswer(btoa(JSON.stringify(pc.localDescription)))}catch{ping("That invite code is invalid")}}
 async function acceptAnswer(){try{await peer.current?.setRemoteDescription(JSON.parse(atob(answer.trim())))}catch{ping("That answer code is invalid")}}

 const canEvac=!game.objectives.length;
 return <main className="shell">
  {toast&&<div className="toast">{toast}</div>}
  {screen==="menu"&&<section className="menu">
   <div className="blood">THE CITY IS LOST</div><h1>DEAD ZONE<br/><em>LAST STAND</em></h1><p className="tag">A COOPERATIVE SURVIVAL BOARD GAME</p>
   <div className="mode-grid">
    <button onClick={()=>start("solo")}><b>SOLO CAMPAIGN</b><span>Command all four survivors</span></button>
    <button onClick={()=>start("local")}><b>COUCH CO-OP</b><span>Pass the screen, share the panic</span></button>
    <button onClick={()=>{start("online");connectSetup("host")}}><b>ONLINE CO-OP</b><span>Link two computers directly</span></button>
   </div>
   <div className="menu-row"><button className="textbtn" onClick={()=>setScreen("rules")}>HOW TO PLAY</button><button className="textbtn" onClick={()=>{const s=localStorage.getItem("deadzone-save");if(s){setGame(JSON.parse(s));setScreen("game")}}}>CONTINUE</button><button className="sound" onClick={()=>setSound(!sound)}>{sound?"SOUND ON":"SOUND OFF"}</button></div>
   <div className="zombie-silhouette">🧟</div>
  </section>}
  {screen==="rules"&&<section className="paper"><button className="back" onClick={()=>setScreen("menu")}>← BACK</button><h2>FIELD MANUAL</h2><div className="rules-grid"><article><b>1. SURVIVORS</b><p>Each survivor gets 3 actions: move, attack, search, heal, or pass.</p></article><article><b>2. THE HORDE</b><p>After the whole team acts, zombies move, bite, and new infected spawn.</p></article><article><b>3. THE MISSION</b><p>Search all three red supply caches, then move every survivor onto the green evac zone.</p></article><article><b>4. COMBAT</b><p>Click an infected in weapon range. Brutes take 2 damage. Danger and spawns rise with XP.</p></article></div><button className="primary" onClick={()=>start("solo")}>BEGIN MISSION</button></section>}
  {screen==="connect"&&<section className="paper connect"><button className="back" onClick={()=>setScreen("menu")}>← MENU</button><h2>DIRECT CO-OP</h2><p>One player hosts. The other joins. Exchange the two codes by message.</p><div className="tabs"><button className={onlineRole==="host"?"on":""} onClick={()=>setOnlineRole("host")}>HOST</button><button className={onlineRole==="guest"?"on":""} onClick={()=>setOnlineRole("guest")}>JOIN</button></div>
   {onlineRole==="host"?<div className="codeflow"><button className="primary" onClick={makeOffer}>1. CREATE INVITE</button>{offer&&<><textarea readOnly value={offer}/><button onClick={()=>navigator.clipboard.writeText(offer)}>COPY INVITE</button><label>3. Paste your partner&apos;s answer</label><textarea value={answer} onChange={e=>setAnswer(e.target.value)}/><button className="primary" onClick={acceptAnswer}>CONNECT & PLAY</button></>}</div>:<div className="codeflow"><label>1. Paste the host&apos;s invite</label><textarea value={offer} onChange={e=>setOffer(e.target.value)}/><button className="primary" onClick={acceptOffer}>2. CREATE ANSWER</button>{answer&&<><textarea readOnly value={answer}/><button onClick={()=>navigator.clipboard.writeText(answer)}>COPY ANSWER TO HOST</button><p>Waiting for host…</p></>}</div>}{connected&&<button className="primary" onClick={()=>setScreen("game")}>ENTER THE DEAD ZONE</button>}
  </section>}
  {screen==="game"&&<section className="game">
   <header><button className="logo" onClick={()=>setScreen("menu")}>DEAD ZONE</button><div className="mission"><span>MISSION 01</span><b>LAST RIDE OUT</b></div><div className="round">ROUND <b>{game.round}</b></div><div className={`danger d${Math.min(game.danger,4)}`}>DANGER <b>{["","LOW","RISING","HIGH","RED"][Math.min(game.danger,4)]}</b></div><button className="iconbtn" onClick={()=>setScreen("rules")}>?</button></header>
   <div className="gamebody"><aside className="squad"><h3>SURVIVORS</h3>{game.heroes.map((h,i)=><button key={h.id} className={`hero ${i===game.active?"active":""}`} onClick={()=>game.mode==="solo"&&i===game.active&&setSelected({x:h.x,y:h.y})} style={{"--c":h.color} as React.CSSProperties}><span className="portrait">{h.icon}</span><span><b>{h.name}</b><small>♥ {h.hp}/3 · {h.weapon}</small></span><i>{h.actions} AP</i></button>)}<div className="objective"><b>OBJECTIVE</b><p>{game.objectives.length?`Secure ${game.objectives.length} supply cache${game.objectives.length>1?"s":""}`:"All survivors reach EVAC"}</p><div className="pips">{[0,1,2].map(i=><i key={i} className={i>=game.objectives.length?"done":""}/>)}</div></div><div className="legend"><span>▣ Search</span><span>● Cache</span><span>▰ Evac</span></div></aside>
    <div className="boardwrap"><div className="board">{Array.from({length:W*H},(_,i)=>{const x=i%W,y=Math.floor(i/W),k=`${x},${y}`,zs=game.zombies.filter(z=>z.x===x&&z.y===y),hs=game.heroes.filter(h=>h.x===x&&h.y===y);return <button aria-label={`Zone ${x+1}, ${y+1}`} key={k} disabled={walls.has(k)} onClick={()=>clickCell(x,y)} className={`cell ${buildings.has(k)?"building":"street"} ${walls.has(k)?"wall":""} ${exits.has(k)?"exit":""} ${selected?.x===x&&selected?.y===y?"selected":""}`}><span className="tilelabel">{exits.has(k)?"EVAC":buildings.has(k)?"ROOM":"STREET"}</span>{crates.includes(k)&&!game.searched.includes(k)&&<span className={`crate ${game.objectives.includes(k)?"hot":""}`}>▣</span>}<span className="pieces">{hs.map(h=><i key={h.id} className="mini" style={{background:h.color}} title={h.name}>{h.icon}</i>)}{zs.map(z=><i key={z.id} className={`zombie ${z.kind}`} title={z.kind}>{zIcon[z.kind]}</i>)}</span></button>})}</div>{canEvac&&<div className="evacnote">EVAC ROUTE OPEN — GET EVERYONE TO THE GREEN ZONE!</div>}</div>
    <aside className="panel"><div className="turn"><small>CURRENT TURN</small><h2 style={{color:hero.color}}>{hero.name}</h2><div className="ap">{[0,1,2].map(i=><i key={i} className={i<hero.actions?"full":""}/>)}</div></div><div className="weapon"><small>EQUIPPED</small><b>{hero.weapon}</b><span>RANGE {hero.range||"MELEE"} · DMG {hero.damage}</span></div><div className="actions"><button onClick={search}>▣ SEARCH</button><button onClick={heal}>✚ USE ITEM</button><button className="end" onClick={endTurn}>END TURN →</button></div><div className="combatlog"><b>RADIO CHATTER</b>{game.log.map((l,i)=><p key={i}>{l}</p>)}</div>{game.mode==="online"&&<div className={`link ${connected?"good":""}`}>● {connected?"PARTNER CONNECTED":"OFFLINE — LOCAL CONTROL"}</div>}</aside>
   </div>
   {game.status!=="playing"&&<div className="modal"><div><span>{game.status==="won"?"EVACUATED":"OVERRUN"}</span><h2>{game.status==="won"?"YOU MADE IT OUT ALIVE":"THE CITY CLAIMS ANOTHER SQUAD"}</h2><p>Survived {game.round} rounds · {game.heroes.reduce((n,h)=>n+h.kills,0)} infected eliminated</p><button className="primary" onClick={()=>start(game.mode)}>PLAY AGAIN</button><button onClick={()=>setScreen("menu")}>MAIN MENU</button></div></div>}
  </section>}
 </main>
}
