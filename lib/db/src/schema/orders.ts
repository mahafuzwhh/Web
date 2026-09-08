import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type StoredOrderItem = {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
};

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),
  whatsapp: text("whatsapp"),
  district: text("district").notNull(),
  upazila: text("upazila").notNull(),
  postOffice: text("post_office").notNull(),
  village: text("village").notNull(),
  houseNo: text("house_no").notNull(),
  additionalAddress: text("additional_address"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  status: text("status").notNull().default("pending"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2, mode: "number" }).notNull(),
  deliveryCharge: numeric("delivery_charge", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).notNull(),
  total: numeric("total", { precision: 10, scale: 2, mode: "number" }).notNull(),
  items: jsonb("items").$type<StoredOrderItem[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;