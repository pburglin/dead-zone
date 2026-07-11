import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("ships all three requested play modes", () => {
  assert.match(source, /SOLO CAMPAIGN/);
  assert.match(source, /COUCH CO-OP/);
  assert.match(source, /ONLINE CO-OP/);
  assert.match(source, /RTCPeerConnection/);
});

test("includes a complete survival loop", () => {
  for (const feature of ["function attack", "function search", "function zombiePhase", 'g.status="won"', 'g.status="lost"']) assert.ok(source.includes(feature), `missing ${feature}`);
});

test("production output renders the game menu", async () => {
  const { default: worker } = await import(new URL(`../dist/server/index.js?${Date.now()}`, import.meta.url));
  const response = await worker.fetch(new Request("http://localhost/",{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});
  const html=await response.text(); assert.equal(response.status,200); assert.match(html,/Dead Zone: Last Stand/); assert.match(html,/SOLO CAMPAIGN/);
});
