import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const rooms = await readFile(new URL("../app/api/rooms/route.ts", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("ships all three requested play modes", () => {
  assert.match(source, /SOLO CAMPAIGN/);
  assert.match(source, /COUCH CO-OP/);
  assert.match(source, /ONLINE CO-OP/);
  assert.match(source, /RTCPeerConnection/);
});

test("includes a complete survival loop", () => {
  for (const feature of ["function attack", "function search", "function zombiePhase", 'g.status="won"', 'g.status="lost"']) assert.ok(source.includes(feature), `missing ${feature}`);
});

test("includes the tactical art and rules upgrade", () => {
  for (const feature of ["WebGLEffects", "webgl", "openDoors", "function openDoor", "function moveItem", "function giveItem", "hands:(Item|null)[]", "bag:(Item|null)[]", "noise:number", "survivor-piece", "zombie-piece"]) assert.ok(source.includes(feature), `missing ${feature}`);
});

test("creates link-based multiplayer rooms with automatic aliases", () => {
  for (const feature of ["createRoom", "joinRoom", "?room=", "Player 1", "playerCount"]) assert.ok(source.includes(feature), `missing ${feature}`);
  for (const feature of ['action==="create"', 'action==="join"', "Player ${count}", "game_rooms"]) assert.ok(rooms.includes(feature), `missing room service ${feature}`);
});

test("supports host termination and a recoverable illustrated defeat", () => {
  for (const feature of ["terminateGame", "confirmQuit", "RETURN TO MAIN MENU", "THE HORDE WINS"]) assert.ok(source.includes(feature), `missing ${feature}`);
  assert.ok(css.includes("zombie-victory.png"));
});

test("uses illustrated equipment and blocks room boundaries without open doors", () => {
  for (const feature of ["equipment-atlas.png", "item-rifle", "item-shotgun", "item-medkit", "background-size:1110% 465%", "linear-gradient(0deg"]) assert.ok(css.includes(feature), `missing visual correction ${feature}`);
  for (const feature of ["const canCross", "map.walls.has(key)", "map.doors.has(e)&&open.includes(e)", "pathTo(z,t,g.openDoors)"]) assert.ok(source.includes(feature), `missing movement guard ${feature}`);
});

test("supports mission selection, eight survivors, directional doors, pathfinding, and correct range", () => {
  for (const feature of ["NO QUIET WARD", "BLACKOUT AT PRECINCT 9", "Nova", "Father Eli", "Jinx", "Bear", "doorSide", "door-top", "door-left", "pathTo", "lineOfSight", "d>=range", "MISSION CONTROL", "missionbrief", "AudioContext"]) assert.ok((source+css).includes(feature), `missing expansion ${feature}`);
  assert.ok(source.includes('Machete:{name:"Machete",icon:"🗡",range:1'));
  assert.ok(source.includes('Shotgun:{name:"Shotgun",icon:"▰",range:2'));
  assert.ok(source.includes('Rifle:{name:"Rifle",icon:"⌁",range:3'));
});

test("switches supplied music by game state and separates persistent audio controls", async () => {
  for (const feature of ["/music-gameplay.mp3", "/music-intro${introTrack.current}.webm", "deadzone-music", "deadzone-sound", "toggleMusic", "toggleSound", "global-audio"]) assert.ok(source.includes(feature), `missing audio feature ${feature}`);
  await Promise.all([access(new URL("../public/music-gameplay.mp3",import.meta.url)),access(new URL("../public/music-intro1.webm",import.meta.url)),access(new URL("../public/music-intro2.webm",import.meta.url))]);
});

test("moves traded items atomically, turns fallen survivors, and keeps evac routes openable", () => {
  for (const feature of ["from.bag[index]=null", "to.bag[dest]={...source}", 'kind:"walker",x:h.x,y:h.y', "g.heroes=g.heroes.filter(h=>h.hp>0)", "makeDoors", '"0,1|0,2","0,1"', '"7,4|7,5","7,4"']) assert.ok(source.includes(feature), `missing bugfix ${feature}`);
  assert.ok(!source.includes("findIndex(v=>v===item)"),"identity-based inventory removal must not return");
});

test("targets exact doors, layers board assets, separates survivor art, and marks sewer spawns", async () => {
  for (const feature of ["selectedDoor", "setSelectedDoor(door)", "selectedDoor&&nearby.includes(selectedDoor)", "zombie-layer", "hero-layer", "spawn-hole"]) assert.ok(source.includes(feature), `missing board correction ${feature}`);
  const visual=await readFile(new URL("../app/visual-fixes.css",import.meta.url),"utf8");
  for (const feature of ["z-index:50", "z-index:20", "z-index:30", "z-index:40", "survivor-bodies.png", "survivor-portraits.png", "aspect-ratio:3/4", "aspect-ratio:1"]) assert.ok(visual.includes(feature), `missing visual layer ${feature}`);
  await Promise.all([access(new URL("../public/survivor-bodies.png",import.meta.url)),access(new URL("../public/survivor-portraits.png",import.meta.url))]);
});

test("supports tactical initiative, survivor specialties, and expanding animated maps", async () => {
  for (const feature of ["yieldTo", "INITIATIVE PASSED", "SLIPPERY", "FREE SEARCH", "FREE MOVE", "BONUS MELEE", "BONUS RANGED", "MELEE +1 DMG", "RANGED +1 DMG", "map.w*map.h", "i%map.w", "scrollIntoView", "zoom-controls", "data-active"]) assert.ok(source.includes(feature), `missing tactical expansion ${feature}`);
  assert.ok(source.includes('if(target&&weapon.damage>0&&d>=minimumRange&&lineOfSight(hero,target,effectiveRange)){attack(target.id);return}'));
  assert.ok(source.includes('if(d===1){const trapped='), "an adjacent occupied zone must remain a valid move destination");
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8");
  for (const feature of ["overflow:auto", "survivor-breathe", "zombie-prowl", "brute-loom", "prefers-reduced-motion"]) assert.ok(motion.includes(feature), `missing map motion ${feature}`);
});

test("adds an atmospheric WebGL landing page and dated build marker", async () => {
  for (const feature of ["LandingAtmosphere", "landing-atmosphere", "background-fires", "BUILD 20260712-24"]) assert.ok(source.includes(feature), `missing landing atmosphere ${feature}`);
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8");
  for (const feature of ["mix-blend-mode:screen", "fire-tremble", "build-version"]) assert.ok(motion.includes(feature), `missing landing visual ${feature}`);
});

test("guarantees every starting squad can breach doors", () => {
  for (const feature of ["hasBreacher", "axeBearer", 'partyIndex===axeBearer?ITEMS["Fire Axe"]']) assert.ok(source.includes(feature), `missing breaching safeguard ${feature}`);
});

test("cancels rooms immediately and exposes one accessible audio control set", async () => {
  assert.ok(source.includes('className="back" onClick={terminateGame}>← CANCEL ROOM'));
  assert.ok(!source.includes('className="sound" onClick={toggleMusic}'));
  for (const feature of ["Turn music off", "Turn music on", "Turn sound effects off", "Turn sound effects on", "data-tooltip"]) assert.ok(source.includes(feature), `missing audio control behavior ${feature}`);
  const audioCss=await readFile(new URL("../app/audio.css",import.meta.url),"utf8");
  for (const feature of ["content:attr(data-tooltip)", ":hover:after", ":focus-visible:after"]) assert.ok(audioCss.includes(feature), `missing tooltip style ${feature}`);
});

test("disables unavailable actions and improves board feedback", async () => {
  for (const feature of ["canSearch", "canOpenDoor", "canHeal", "Equip a Medkit in your hand", "Stand beside a closed door", "No more APs left to move", "isDeath?145", "disabled={!canSearch}", "disabled={!canOpenDoor}", "disabled={!canHeal}"]) assert.ok(source.includes(feature), `missing action feedback ${feature}`);
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8"),visual=await readFile(new URL("../app/visual-fixes.css",import.meta.url),"utf8");
  for (const feature of ["action-tip", "will-change:transform", "button:disabled"]) assert.ok(motion.includes(feature), `missing interaction visual ${feature}`);
  for (const feature of ["sewer-manhole-v2.png", ".cell:has(.door)", "z-index:50"]) assert.ok(visual.includes(feature), `missing layered asset ${feature}`);
  await access(new URL("../public/sewer-manhole-v2.png",import.meta.url));
});

test("enforces rifle minimum range and improves combat and outcome feedback", async () => {
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8"),global=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");
  for (const feature of ['minimumRange=weapon.name==="Rifle"?1:0', "d>=minimumRange", "getBoundingClientRect", "HAS TURNED!", "HIT FOR", "data-tooltip={h.name}", "Zombie`", "survivor-victory.png", "outcome-fires"]) assert.ok((source+global).includes(feature), `missing combat feedback ${feature}`);
  assert.ok(motion.includes(".survivor-piece[data-tooltip]:hover:after"));
  assert.ok(global.includes(".victory"));
  await access(new URL("../public/survivor-victory.png",import.meta.url));
});

test("allows same-zone teammate healing and random item loss on hits", () => {
  for (const feature of ["function healTeammate", "FIELD MEDIC · SAME ZONE", "USE MEDKIT ON", "patient.hp=Math.min(3,patient.hp+2)", "Math.random()<.3", "const possessions=", "LOST ${lost.item!.name.toUpperCase()}"]) assert.ok(source.includes(feature), `missing injury inventory rule ${feature}`);
});

test("synchronizes newer room state bidirectionally with revisions", () => {
  for (const feature of ["lastRevision", "pendingWrites", "writeQueue", "writeQueue.current.then", "data.revision>lastRevision.current", "pendingWrites.current===0", "lastSyncEvent", "setInterval", "},500)"]) assert.ok(source.includes(feature), `missing client synchronization ${feature}`);
  assert.ok(!source.includes("if(!isHost&&data.game_json)"), "host must accept guest updates");
  for (const feature of ["RETURNING revision", "revision:updated.revision", "revision:room.revision"]) assert.ok(rooms.includes(feature), `missing server revision response ${feature}`);
});

test("synchronizes staged online setup and keeps co-located tokens visible", async () => {
  for (const feature of ["lobbyPhase", "lobbyMission", "lobbyHeroes", "updateLobby", 'updateLobby("setup")', 'updateLobby("playing"', "WAITING FOR HOST TO SELECT", "WAITING FOR HOST TO LAUNCH", "WAITING FOR HOST TO BEGIN", "function beginMission"]) assert.ok(source.includes(feature), `missing synchronized lobby phase ${feature}`);
  for (const feature of ["freeHandSwap", 'picked.area==="hands"&&area==="hands"', "Switching hands is free"]) assert.ok(source.includes(feature), `missing free hand swap ${feature}`);
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8");
  for (const feature of [".zombie-layer{inset:2% 45%", ".hero-layer{inset:3%", "waiting-host"]) assert.ok(motion.includes(feature), `missing staged token visual ${feature}`);
});

test("distributes crowded tokens and renders connected streets with premium props", async () => {
  for (const feature of ["token-count-${hs.length}", "token-count-${zs.length}", "roadDirs", "road-lines", "streetlight", "targetToken", 'event.kind==="bite"?".survivor-piece":".zombie-piece"', "many-survivors"]) assert.ok(source.includes(feature), `missing map layout feature ${feature}`);
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8"),visual=await readFile(new URL("../app/visual-fixes.css",import.meta.url),"utf8");
  for (const feature of ["token-count-1", "token-count-2", "token-count-3", "token-count-4", "token-count-5", "token-count-6", "sidewalk", "road-lines .road-n", "streetlight-v1.png", "squad.many-survivors"]) assert.ok(motion.includes(feature), `missing formation or road style ${feature}`);
  for (const feature of ["door-closed-v2.png", "door-breached-v2.png"]) assert.ok(visual.includes(feature), `missing door art ${feature}`);
  await Promise.all([access(new URL("../public/door-closed-v2.png",import.meta.url)),access(new URL("../public/door-breached-v2.png",import.meta.url)),access(new URL("../public/streetlight-v1.png",import.meta.url))]);
});

test("anchors hit particles to the exact token in a full-screen WebGL viewport", () => {
  for (const feature of ['[data-token="${event.token}"]', "getBoundingClientRect()", "rect.left+rect.width/2", "rect.top+rect.height/2", "devicePixelRatio||1", "gl.viewport(0,0,c.width,c.height)", "q.size*q.life*dpr"]) assert.ok(source.includes(feature), `missing particle positioning safeguard ${feature}`);
});

test("adds cure mission, synchronized fog of war, and matching boss presentation", async () => {
  for (const feature of ['id:"cure-protocol"', 'title:"THE CURE PROTOCOL"', "Helix Laboratory", "objectiveCount:8", "w:18,h:12", "labRoads", "labBuildings", "labWalls", "spawn:[{x:0,y:6},{x:3,y:0},{x:8,y:11},{x:13,y:0},{x:17,y:6},{x:13,y:11}]", "fogEnabled", "lobbyFog", "chosenFog", "visited", "isRevealed", "Math.abs(vx-x)+Math.abs(vy-y)<=2", "fog-cover", "FOG OF WAR", "LandingAtmosphere active/>"]) assert.ok(source.includes(feature), `missing cure or fog feature ${feature}`);
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8");
  for (const feature of ["zombie-abomination-v2.png", "width:78px", "height:108px", ".fog-cover", "fog-dust-drift", ".fog-choice"]) assert.ok(motion.includes(feature), `missing boss or fog styling ${feature}`);
  await access(new URL("../public/zombie-abomination-v2.png",import.meta.url));
});

test("supports documented keyboard shortcuts and AP-aware turn confirmation", () => {
  for (const feature of ["confirmEndTurn", "function switchHands", 'e.code==="Space"', 'e.key==="1"', 'e.key==="Escape"', 'e.key.toLowerCase()==="i"', 'e.key.toLowerCase()==="m"', 'e.key.toLowerCase()==="b"', 'e.key.toLowerCase()==="s"', "setInventory(true)", "heal()", "openDoor()", "search()", "END TURN ANYWAY", "KEEP ACTING", "⌨ KEYBOARD SHORTCUTS", "SPACE", "Open the selected survivor’s inventory", "Use an equipped Medkit", "Open or break a nearby selected door", "Search the current room", "Switch primary and secondary", "Close Loadout"]) assert.ok(source.includes(feature), `missing keyboard behavior ${feature}`);
  assert.ok(source.includes('if(hero.actions>0)setConfirmEndTurn(true);else endTurn()'));
});

test("colors danger escalation with themed low, orange, and red states", async () => {
  const global=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");
  for (const feature of [".danger.d1 b", ".danger.d2 b,.danger.d3 b", "#ef7f32", ".danger.d4 b", "#e43b32"]) assert.ok(global.includes(feature), `missing danger color state ${feature}`);
});

test("highlights only the active survivor and animates token position changes", async () => {
  for (const feature of ["useLayoutEffect", "tokenRects", "data-token", "data-token={`hero-${h.id}`}", "data-token={`zombie-${z.id}`}", 'h.id===hero.id?"active-piece":""', "getBoundingClientRect", "el.animate", "duration:260"]) assert.ok(source.includes(feature), `missing token transition ${feature}`);
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8");
  assert.ok(motion.includes(".survivor-piece.active-piece"));
  assert.ok(!motion.includes('.cell[data-active="true"] .survivor-piece'),"tile-level active selector must not highlight every survivor");
});

test("expands inventory, bosses, weapons, and path-safe missions", async () => {
  for (const feature of ["function discardItem", 'area==="bag"?1:0', "Discard from hand · Free", "Discard carried item · 1 AP", "EMPTY_HAND", "Empty Hand", "Molotov", "function throwMolotov", "5 damage to every creature", 'kind:"abomination"', "hp:5", 'z.kind==="abomination"?3:1', "FIRE ON THE RIVERFRONT", "THE LAST BROADCAST", "objectiveCount:5", "objectiveCount:6", 'initialOpenDoors:["7,4|7,5"]']) assert.ok(source.includes(feature), `missing expansion rule ${feature}`);
  assert.ok(!source.includes("PASS INITIATIVE"));
  assert.ok(source.includes(":yieldTo(i)"));
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8");
  for (const feature of ["item-empty-hand.png", "item-molotov.png", "zombie-abomination-v2.png", ".slots .discard"]) assert.ok(motion.includes(feature), `missing expansion art style ${feature}`);
  await Promise.all([access(new URL("../public/item-empty-hand.png",import.meta.url)),access(new URL("../public/item-molotov.png",import.meta.url)),access(new URL("../public/zombie-abomination-v2.png",import.meta.url))]);
});

test("production output contains the game and migration", async () => {
  await Promise.all([access(new URL("../dist/server/index.js",import.meta.url)),access(new URL("../dist/client/zombie-victory.png",import.meta.url)),access(new URL("../dist/.openai/drizzle/0000_glamorous_imperial_guard.sql",import.meta.url))]);
});
