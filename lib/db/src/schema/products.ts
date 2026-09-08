import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categorySlug: text("category_slug").notNull(),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
  compareAtPrice: numeric("compare_at_price", {
    precision: 10,
    scale: 2,
    mode: "number",
  }),
  image: text("image").notNull(),
  description: text("description").notNull(),
  stock: integer("stock").notNull().default(0),
  rating: numeric("rating", { precision: 2, scale: 1, mode: "number" })
    .notNull()
    .default(0),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  badge: text("badge"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;