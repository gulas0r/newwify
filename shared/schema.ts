import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotify_id").notNull().unique(),
  displayName: text("display_name"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: timestamp("token_expiry").notNull(),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const topTracks = pgTable("top_tracks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  spotifyTrackId: text("spotify_track_id").notNull(),
  trackName: text("track_name").notNull(),
  artistName: text("artist_name").notNull(),
  albumName: text("album_name"),
  albumImage: text("album_image"),
  popularity: integer("popularity"),
});

export const insertTopTrackSchema = createInsertSchema(topTracks).omit({
  id: true,
});

export type InsertTopTrack = z.infer<typeof insertTopTrackSchema>;
export type TopTrack = typeof topTracks.$inferSelect;

export const userBiographies = pgTable("user_biographies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  biographyEn: text("biography_en").notNull(),
  biographyTr: text("biography_tr").notNull(),
  biographyKu: text("biography_ku").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserBiographySchema = createInsertSchema(userBiographies).omit({
  id: true,
  createdAt: true,
});

export type InsertUserBiography = z.infer<typeof insertUserBiographySchema>;
export type UserBiography = typeof userBiographies.$inferSelect;
