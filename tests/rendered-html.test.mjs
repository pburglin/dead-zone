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

test("production output contains the game and migration", async () => {
  await Promise.all([access(new URL("../dist/server/index.js",import.meta.url)),access(new URL("../dist/client/zombie-victory.png",import.meta.url)),access(new URL("../dist/.openai/drizzle/0000_glamorous_imperial_guard.sql",import.meta.url))]);
});
