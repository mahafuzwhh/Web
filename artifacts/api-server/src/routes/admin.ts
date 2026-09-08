import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateCategoryBody,
  CreateCategoryResponse,
  CreateProductBody,
  CreateProductResponse,
  DeleteCategoryParams,
  DeleteProductParams,
  GetAdminSummaryResponse,
  ListAdminOrdersResponse,
  UpdateOrderStatusBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  UpdateCategoryResponse,
  UpdateOrderStatusParams,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";
import {
  categoriesTable,
  db,
  ordersTable,
  productsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import {
  categoriesResponse,
  getCategoryMap,
  productResponse,
} from "../lib/catalog";
import { addressFromOrder, trackedOrderResponse } from "./orders";

const router: IRouter = Router();
router.use("/admin", requireAuth);

router.get("/admin/summary", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable);
  const products = await db.select().from(productsTable);
  res.json(
    GetAdminSummaryResponse.parse({
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === "pending").length,
      deliveredOrders: orders.filter((order) => order.status === "delivered").length,
      totalSales: orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + Number(order.total), 0),
      lowStockProducts: products.filter((product) => product.stock > 0 && product.stock <= 5).length,
      outOfStockProducts: products.filter((product) => product.stock === 0).length,
    }),
  );
});

router.get("/admin/orders", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(
    ListAdminOrdersResponse.parse(
      orders.map((order) => ({
        ...trackedOrderResponse(order),
        whatsapp: order.whatsapp,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      })),
    ),
  );
});

router.patch("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid order status update" });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({
      status: body.data.status,
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.orderId, params.data.id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(
    ListAdminOrdersResponse.element.parse({
      ...trackedOrderResponse(order),
      whatsapp: order.whatsapp,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    }),
  );
});

router.post("/products", requireAuth, async (req, res): Promise<void> => {
  const body = CreateProductBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values(body.data).returning();
  res.status(201).json(
    CreateProductResponse.parse(productResponse(product, await getCategoryMap())),
  );
});

router.patch("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  const body = UpdateProductBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid product update" });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(
    UpdateProductResponse.parse(productResponse(product, await getCategoryMap())),
  );
});

router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/categories", requireAuth, async (req, res): Promise<void> => {
  const body = CreateCategoryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [category] = await db.insert(categoriesTable).values(body.data).returning();
  res.status(201).json(
    CreateCategoryResponse.parse({ ...category, productCount: 0 }),
  );
});

router.patch("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  const body = UpdateCategoryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid category update" });
    return;
  }
  const [category] = await db
    .update(categoriesTable)
    .set(body.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const updated = (await categoriesResponse()).find((item) => item.id === category.id);
  res.json(UpdateCategoryResponse.parse(updated ?? { ...category, productCount: 0 }));
});

router.delete("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [category] = await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;