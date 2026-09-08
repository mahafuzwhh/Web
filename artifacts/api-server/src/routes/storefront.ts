import { and, desc, eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetProductParams,
  GetProductResponse,
  GetStorefrontResponse,
  ListCategoriesResponse,
  ListProductsQueryParams,
  ListProductsResponse,
} from "@workspace/api-zod";
import { db, productsTable } from "@workspace/db";
import { categoriesResponse, getCategoryMap, productResponse } from "../lib/catalog";

const router: IRouter = Router();

router.get("/storefront", async (_req, res): Promise<void> => {
  const categoryMap = await getCategoryMap();
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  const mapped = products.map((product) => productResponse(product, categoryMap));
  const categories = await categoriesResponse();

  res.json(
    GetStorefrontResponse.parse({
      categories,
      featured: mapped.filter((product) => product.featured).slice(0, 8),
      newArrivals: mapped.slice(0, 8),
      offers: mapped
        .filter(
          (product) =>
            product.compareAtPrice != null &&
            product.compareAtPrice > product.price,
        )
        .slice(0, 8),
    }),
  );
});

router.get("/categories", async (_req, res): Promise<void> => {
  res.json(ListCategoriesResponse.parse(await categoriesResponse()));
});

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category, featured, limit } = parsed.data;
  const filters = [];
  if (search) {
    filters.push(
      or(
        ilike(productsTable.name, `%${search}%`),
        ilike(productsTable.description, `%${search}%`),
      ),
    );
  }
  if (category) filters.push(eq(productsTable.categorySlug, category));
  if (featured !== undefined) filters.push(eq(productsTable.featured, featured));

  const products = await db
    .select()
    .from(productsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(productsTable.createdAt))
    .limit(limit ?? 100);
  const categoryMap = await getCategoryMap();

  res.json(ListProductsResponse.parse(products.map((product) => productResponse(product, categoryMap))));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(productResponse(product, await getCategoryMap())));
});

export default router;