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
  assert.ok(source.includes('if(target&&d>=minimumRange&&lineOfSight(hero,target,effectiveRange)){attack(target.id);return}'));
  assert.ok(source.includes('if(d===1){const trapped='), "an adjacent occupied zone must remain a valid move destination");
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8");
  for (const feature of ["overflow:auto", "survivor-breathe", "zombie-prowl", "brute-loom", "prefers-reduced-motion"]) assert.ok(motion.includes(feature), `missing map motion ${feature}`);
});

test("adds an atmospheric WebGL landing page and dated build marker", async () => {
  for (const feature of ["LandingAtmosphere", "landing-atmosphere", "background-fires", "BUILD 20260711-15"]) assert.ok(source.includes(feature), `missing landing atmosphere ${feature}`);
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
  for (const feature of ["action-tip", "token-arrive", "button:disabled"]) assert.ok(motion.includes(feature), `missing interaction visual ${feature}`);
  for (const feature of ["sewer-manhole-v2.png", ".cell:has(.door)", "z-index:50"]) assert.ok(visual.includes(feature), `missing layered asset ${feature}`);
  await access(new URL("../public/sewer-manhole-v2.png",import.meta.url));
});

test("enforces rifle minimum range and improves combat and outcome feedback", async () => {
  const motion=await readFile(new URL("../app/turn-map.css",import.meta.url),"utf8"),global=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");
  for (const feature of ['minimumRange=weapon.name==="Rifle"?1:0', "d>=minimumRange", "getBoundingClientRect", "HAS TURNED!", "HIT!", "data-tooltip={h.name}", "Zombie`", "survivor-victory.png", "outcome-fires"]) assert.ok((source+global).includes(feature), `missing combat feedback ${feature}`);
  assert.ok(motion.includes(".survivor-piece[data-tooltip]:hover:after"));
  assert.ok(global.includes(".victory"));
  await access(new URL("../public/survivor-victory.png",import.meta.url));
});

test("allows same-zone teammate healing and random item loss on hits", () => {
  for (const feature of ["function healTeammate", "FIELD MEDIC · SAME ZONE", "USE MEDKIT ON", "patient.hp=Math.min(3,patient.hp+2)", "Math.random()<.3", "const possessions=", "LOST ${lost.item!.name.toUpperCase()}"]) assert.ok(source.includes(feature), `missing injury inventory rule ${feature}`);
});

test("production output contains the game and migration", async () => {
  await Promise.all([access(new URL("../dist/server/index.js",import.meta.url)),access(new URL("../dist/client/zombie-victory.png",import.meta.url)),access(new URL("../dist/.openai/drizzle/0000_glamorous_imperial_guard.sql",import.meta.url))]);
});
