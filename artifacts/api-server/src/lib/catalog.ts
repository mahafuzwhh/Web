import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable, type Product } from "@workspace/db";

export async function getCategoryMap(): Promise<Map<string, string>> {
  const categories = await db.select().from(categoriesTable);
  return new Map(categories.map((category) => [category.slug, category.name]));
}

export function productResponse(
  product: Product,
  categoryMap: Map<string, string>,
) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: categoryMap.get(product.categorySlug) ?? product.categorySlug,
    categorySlug: product.categorySlug,
    price: Number(product.price),
    compareAtPrice:
      product.compareAtPrice == null ? null : Number(product.compareAtPrice),
    image: product.image,
    description: product.description,
    stock: product.stock,
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    featured: product.featured,
    badge: product.badge ?? null,
  };
}

export async function categoriesResponse() {
  const categories = await db.select().from(categoriesTable);
  const counts = await db
    .select({
      categorySlug: productsTable.categorySlug,
      count: sql<number>`count(*)::int`,
    })
    .from(productsTable)
    .groupBy(productsTable.categorySlug);
  const countMap = new Map(counts.map((item) => [item.categorySlug, Number(item.count)]));

  return categories.map((category) => ({
    ...category,
    productCount: countMap.get(category.slug) ?? 0,
  }));
}

export async function categoryName(slug: string): Promise<string> {
  const [category] = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug));
  return category?.name ?? slug;
}