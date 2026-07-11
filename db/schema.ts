import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gameRooms = sqliteTable("game_rooms", {
  id: text("id").primaryKey(),
  gameJson: text("game_json").notNull(),
  playerCount: integer("player_count").notNull().default(1),
  revision: integer("revision").notNull().default(1),
  ended: integer("ended", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
