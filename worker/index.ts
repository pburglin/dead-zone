/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/rooms" || url.pathname === "/api/rooms/") {
      const jsonHeaders={"content-type":"application/json","cache-control":"no-store"};
      const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:jsonHeaders});
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_rooms (id TEXT PRIMARY KEY, game_json TEXT NOT NULL, player_count INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 1, ended INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`).run();
      if(request.method==="GET"){const id=url.searchParams.get("id");if(!id)return reply({error:"Missing room"},400);const room=await env.DB.prepare("SELECT id, game_json, player_count, revision, ended FROM game_rooms WHERE id = ?").bind(id).first();return room?reply(room):reply({error:"Room not found"},404)}
      if(request.method==="POST"){const body=await request.json() as {action:string;id?:string;game?:unknown};const now=Date.now();if(body.action==="create"){const id=crypto.randomUUID().replaceAll("-","").slice(0,10).toUpperCase();await env.DB.prepare("INSERT INTO game_rooms (id, game_json, player_count, revision, ended, created_at, updated_at) VALUES (?, ?, 1, 1, 0, ?, ?)").bind(id,JSON.stringify(body.game),now,now).run();return reply({id,alias:"Player 1",playerCount:1,revision:1})}if(!body.id)return reply({error:"Missing room"},400);if(body.action==="join"){const room=await env.DB.prepare("SELECT player_count, ended FROM game_rooms WHERE id = ?").bind(body.id).first<{player_count:number;ended:number}>();if(!room)return reply({error:"Room not found"},404);if(room.ended)return reply({error:"Game has ended"},410);const count=Math.min(8,room.player_count+1);await env.DB.prepare("UPDATE game_rooms SET player_count = ?, updated_at = ? WHERE id = ?").bind(count,now,body.id).run();return reply({id:body.id,alias:`Player ${count}`,playerCount:count})}if(body.action==="update"){await env.DB.prepare("UPDATE game_rooms SET game_json = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND ended = 0").bind(JSON.stringify(body.game),now,body.id).run();return reply({ok:true})}if(body.action==="end"){await env.DB.prepare("UPDATE game_rooms SET ended = 1, revision = revision + 1, updated_at = ? WHERE id = ?").bind(now,body.id).run();return reply({ok:true})}return reply({error:"Unknown action"},400)}
      return reply({error:"Method not allowed"},405);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
