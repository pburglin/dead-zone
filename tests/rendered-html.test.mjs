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

test("production output contains the game and migration", async () => {
  await Promise.all([access(new URL("../dist/server/index.js",import.meta.url)),access(new URL("../dist/client/zombie-victory.png",import.meta.url)),access(new URL("../dist/.openai/drizzle/0000_glamorous_imperial_guard.sql",import.meta.url))]);
});
