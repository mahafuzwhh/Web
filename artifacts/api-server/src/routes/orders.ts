import { randomInt } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateOrderBody,
  CreateOrderResponse,
  TrackOrderBody,
  TrackOrderResponse,
} from "@workspace/api-zod";
import {
  db,
  ordersTable,
  productsTable,
  type StoredOrderItem,
} from "@workspace/db";

const router: IRouter = Router();
const DELIVERY_CHARGE = 150;

function addressFromOrder(order: typeof ordersTable.$inferSelect): string {
  return [
    order.houseNo,
    order.village,
    order.postOffice,
    order.upazila,
    order.district,
    order.additionalAddress,
  ]
    .filter(Boolean)
    .join(", ");
}

function orderResponse(order: typeof ordersTable.$inferSelect) {
  return {
    orderId: order.orderId,
    status: order.status,
    subtotal: Number(order.subtotal),
    deliveryCharge: Number(order.deliveryCharge),
    total: Number(order.total),
    paymentStatus: order.paymentStatus,
    items: order.items,
  };
}

function trackedOrderResponse(order: typeof ordersTable.$inferSelect) {
  return {
    ...orderResponse(order),
    customerName: order.customerName,
    createdAt: order.createdAt,
    address: addressFromOrder(order),
  };
}

function nextOrderId(): string {
  return `MNX-${randomInt(100000, 999999)}`;
}

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await db.transaction(async (tx) => {
    const productIds = parsed.data.items.map((item) => item.productId);
    const products = await tx
      .select()
      .from(productsTable)
      .where(inArray(productsTable.id, productIds));
    const productMap = new Map(products.map((product) => [product.id, product]));

    const items: StoredOrderItem[] = [];
    for (const item of parsed.data.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        throw new Error(`${product.name} has only ${product.stock} left`);
      }
      const unitPrice = Number(product.price);
      items.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        image: product.image,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    let orderId = nextOrderId();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const [existing] = await tx
        .select({ id: ordersTable.id })
        .from(ordersTable)
        .where(eq(ordersTable.orderId, orderId));
      if (!existing) break;
      orderId = nextOrderId();
    }

    const [order] = await tx
      .insert(ordersTable)
      .values({
        orderId,
        customerName: parsed.data.name,
        mobile: parsed.data.mobile,
        whatsapp: parsed.data.whatsapp ?? null,
        district: parsed.data.district,
        upazila: parsed.data.upazila,
        postOffice: parsed.data.postOffice,
        village: parsed.data.village,
        houseNo: parsed.data.houseNo,
        additionalAddress: parsed.data.additionalAddress ?? null,
        paymentMethod: parsed.data.paymentMethod,
        paymentStatus: parsed.data.paymentMethod === "cod" ? "unpaid" : "pending_setup",
        status: "pending",
        subtotal,
        deliveryCharge: DELIVERY_CHARGE,
        total: subtotal + DELIVERY_CHARGE,
        items,
      })
      .returning();

    for (const item of items) {
      await tx
        .update(productsTable)
        .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
        .where(eq(productsTable.id, item.productId));
    }

    return order;
  });

  res.status(201).json(CreateOrderResponse.parse(orderResponse(result)));
});

router.post("/orders/track", async (req, res): Promise<void> => {
  const parsed = TrackOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.orderId, parsed.data.orderId.toUpperCase()),
        eq(ordersTable.mobile, parsed.data.mobile),
      ),
    );
  if (!order) {
    res.status(404).json({ error: "We could not find an order with those details" });
    return;
  }

  res.json(TrackOrderResponse.parse(trackedOrderResponse(order)));
});

export { DELIVERY_CHARGE, addressFromOrder, orderResponse, trackedOrderResponse };
export default router;