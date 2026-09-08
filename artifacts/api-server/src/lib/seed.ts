import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { logger } from "./logger";

const categories = [
  { name: "Chargers", slug: "chargers", icon: "zap" },
  { name: "Audio", slug: "audio", icon: "headphones" },
  { name: "Cables", slug: "cables", icon: "cable" },
  { name: "Phones", slug: "phones", icon: "smartphone" },
  { name: "Power", slug: "power", icon: "battery-charging" },
];

const products = [
  {
    name: "Anker 20W Nano Charger",
    slug: "anker-20w-nano-charger",
    categorySlug: "chargers",
    price: 1890,
    compareAtPrice: 2190,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=85",
    description: "Pocket-sized fast charging for phones, earbuds, and everyday devices.",
    stock: 18,
    rating: 4.8,
    reviewCount: 46,
    featured: true,
    badge: "Best seller",
  },
  {
    name: "Baseus Cafule USB-C Cable",
    slug: "baseus-cafule-usb-c-cable",
    categorySlug: "cables",
    price: 590,
    compareAtPrice: 750,
    image: "https://images.unsplash.com/photo-1609592424928-3f50f5f3f0df?auto=format&fit=crop&w=900&q=85",
    description: "Braided, dependable, and ready for daily charging and data transfer.",
    stock: 42,
    rating: 4.7,
    reviewCount: 81,
    featured: true,
    badge: "New",
  },
  {
    name: "SoundPEATS Air4 Lite TWS",
    slug: "soundpeats-air4-lite-tws",
    categorySlug: "audio",
    price: 2990,
    compareAtPrice: 3490,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85",
    description: "Clear calls, low-latency listening, and a pocket-ready charging case.",
    stock: 11,
    rating: 4.6,
    reviewCount: 32,
    featured: true,
    badge: "Hot deal",
  },
  {
    name: "Hoco Y1 Mini Bluetooth Speaker",
    slug: "hoco-y1-mini-bluetooth-speaker",
    categorySlug: "audio",
    price: 1290,
    compareAtPrice: 1590,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
    description: "A compact sound box for desks, balconies, and small hangouts.",
    stock: 7,
    rating: 4.5,
    reviewCount: 19,
    featured: true,
    badge: "Weekend pick",
  },
  {
    name: "Remax 10000mAh Power Bank",
    slug: "remax-10000mah-power-bank",
    categorySlug: "power",
    price: 1690,
    compareAtPrice: 1990,
    image: "https://images.unsplash.com/photo-1609592424928-3f50f5f3f0df?auto=format&fit=crop&w=900&q=85",
    description: "Reliable backup power with a slim profile for commutes and travel.",
    stock: 23,
    rating: 4.4,
    reviewCount: 27,
    featured: false,
    badge: null,
  },
  {
    name: "Nokia 105 Classic Button Phone",
    slug: "nokia-105-classic-button-phone",
    categorySlug: "phones",
    price: 2490,
    compareAtPrice: null,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",
    description: "Simple calling, long battery life, and a familiar tactile keypad.",
    stock: 5,
    rating: 4.8,
    reviewCount: 15,
    featured: false,
    badge: "Low stock",
  },
];

export async function seedDatabase(): Promise<void> {
  const existingCategories = await db.select({ id: categoriesTable.id }).from(categoriesTable).limit(1);
  if (existingCategories.length === 0) {
    await db.insert(categoriesTable).values(categories);
  }

  const existingProducts = await db.select({ id: productsTable.id }).from(productsTable).limit(1);
  if (existingProducts.length === 0) {
    await db.insert(productsTable).values(products);
    logger.info({ products: products.length }, "Seeded demo catalog");
  }
}