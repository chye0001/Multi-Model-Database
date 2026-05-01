import "dotenv/config";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";

import { Country, Category, User, Brand, Item, Closet, Outfit, Role } from "../models/index.js";
import type { ICountry, ICategory, IBrand, IUser, IItem, ICloset, IOutfit } from "../models/index.js";

import bcrypt from "bcrypt";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function clearAll() {
  await Promise.all([
    Role.deleteMany({}),
    Country.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Item.deleteMany({}),
    User.deleteMany({}),
    Closet.deleteMany({}),
    Outfit.deleteMany({}),
  ]);

  // Sync indexes after clearing to avoid stale index conflicts
  await Promise.all([
    Role.syncIndexes(),
    Country.syncIndexes(),
    Category.syncIndexes(),
    Brand.syncIndexes(),
    Item.syncIndexes(),
    User.syncIndexes(),
    Closet.syncIndexes(),
    Outfit.syncIndexes(),
  ]);
}

// ---------------------------------------------------------------------------
// seed
// ---------------------------------------------------------------------------

export async function seed(shouldDisconnect = true, isTestRun = false) {
  // Only connect if not already connected (useful for tests)
  const wasConnected = mongoose.connection.readyState !== 0;
  if (!wasConnected) {
    // Lazy-load connection functions only when needed
    const { connectMongo, disconnectMongo } = await import("../mongoose-client.js");
    await connectMongo();
  }
  await clearAll();

  // ── 1. countries ──────────────────────────────────────────────────────────
  const [denmark, usa] = await Country.insertMany([
    { id: 1, name: "Denmark",       countryCode: "DK" },
    { id: 2, name: "United States", countryCode: "US" },
  ]) as HydratedDocument<ICountry>[];
  console.log("[seed] countries ✓");

  // ── 2. categories ─────────────────────────────────────────────────────────
  const [tops, bottoms, outerwear, footwear] = await Category.insertMany([
    { id: 1, name: "Tops" },
    { id: 2, name: "Bottoms" },
    { id: 3, name: "Outerwear" },
    { id: 4, name: "Footwear" },
  ]) as HydratedDocument<ICategory>[];
  console.log("[seed] categories ✓");

  // ── 3. brands ─────────────────────────────────────────────────────────────
  const [norseProjects, apc] = await Brand.insertMany([
    { 
      id: 1, 
      name: "Norse Projects", 
      country: { id: denmark!.id, name: denmark!.name, countryCode: denmark!.countryCode } 
    },
    { 
      id: 2, 
      name: "A.P.C.",
      country: { id: usa!.id, name: usa!.name, countryCode: usa!.countryCode } 
    },
  ]) as HydratedDocument<IBrand>[];
  console.log("[seed] brands ✓");

  // ── 4. roles ──────────────────────────────────────────────────────────────
  await Role.insertMany([
    { id: 1, name: "admin" },
    { id: 2, name: "user" },
    { id: 3, name: "moderator" },
  ]);
  console.log("[seed] roles ✓");

  // ── 5. users ──────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("test", 10);

  const [alice, bob, carol, dave] = await User.insertMany([
    {
      id: randomUUID(),
      email: "alice@example.com",
      password: hashedPassword,
      firstName: "Alice",
      lastName: "Smith",
      role: { id: 1, name: "admin" },
      country: { id: denmark!.id, name: denmark!.name, countryCode: denmark!.countryCode },
    },
    {
      id: randomUUID(),
      email: "bob@example.com",
      password: hashedPassword,
      firstName: "Bob",
      lastName: "Johnson",
      role: { id: 2, name: "user" },
      country: { id: usa!.id, name: usa!.name, countryCode: usa!.countryCode },
    },
    {
      id: randomUUID(),
      email: "carol@example.com",
      password: hashedPassword,
      firstName: "Carol",
      lastName: "Williams",
      role: { id: 2, name: "user" },
      country: { id: usa!.id, name: usa!.name, countryCode: usa!.countryCode },
    },
    {
      id: randomUUID(),
      email: "dave@example.com",
      password: hashedPassword,
      firstName: "Dave",
      lastName: "Brown",
      role: { id: 3, name: "moderator" },
      country: { id: denmark!.id, name: denmark!.name, countryCode: denmark!.countryCode },
    },
  ]) as HydratedDocument<IUser>[];
  console.log("[seed] users ✓");

  // ── 6. items ──────────────────────────────────────────────────────────────
  const [woolJacket, straightJeans, whiteShirt, leatherBoots] =
    await Item.insertMany([
      {
        id: 1,
        name: "Wool Jacket",
        price: 1299.0,
        category: { categoryId: outerwear!.id, name: outerwear!.name },
        brands: [
          { 
            id: norseProjects!.id, 
            name: norseProjects!.name, 
            country: norseProjects!.country 
          }
        ],
        images: [{ id: 1, url: "https://cdn.example.com/wool-jacket.jpg" }],
      },
      {
        id: 2,
        name: "Straight Jeans",
        price: 899.0,
        category: { categoryId: bottoms!.id, name: bottoms!.name },
        brands: [
          { 
            id: apc!.id, 
            name: apc!.name, 
            country: apc!.country 
          }
        ],
        images: [{ id: 2, url: "https://cdn.example.com/straight-jeans.jpg" }],
      },
      {
        id: 3,
        name: "White Oxford Shirt",
        price: 599.0,
        category: { categoryId: tops!.id, name: tops!.name },
        brands: [
          { 
            id: norseProjects!.id, 
            name: norseProjects!.name, 
            country: norseProjects!.country 
          },
          { 
            id: apc!.id, 
            name: apc!.name, 
            country: apc!.country 
          }
        ],
        images: [{ id: 3, url: "https://cdn.example.com/white-shirt.jpg" }],
      },
      {
        id: 4,
        name: "Leather Chelsea Boots",
        price: 1599.0,
        category: { categoryId: footwear!.id, name: footwear!.name },
        brands: [
          { 
            id: norseProjects!.id, 
            name: norseProjects!.name, 
            country: norseProjects!.country 
          }
        ],
        images: [{ id: 4, url: "https://cdn.example.com/chelsea-boots.jpg" }],
      },
    ]) as HydratedDocument<IItem>[];
  console.log("[seed] items ✓");

  // ── 7. closets ────────────────────────────────────────────────────────────
  await Closet.insertMany([
    {
      id: 1,
      name: "Alice's Wardrobe",
      description: "My everyday essentials",
      isPublic: true,
      userId: alice!._id,
      itemIds: [woolJacket!._id, whiteShirt!._id, leatherBoots!._id],
      sharedWith: [
        { 
          id: bob!.id, 
          firstName: bob!.firstName, 
          lastName: bob!.lastName, 
          email: bob!.email 
        }
      ],
    },
    {
      id: 2,
      name: "Bob's Casual Fits",
      description: null,
      isPublic: false,
      userId: bob!._id,
      itemIds: [straightJeans!._id, whiteShirt!._id],
      sharedWith: [],
    },
  ]);
  console.log("[seed] closets ✓");

  // ── 8. outfits ────────────────────────────────────────────────────────────
  await Outfit.insertMany([
    {
      id: 1,
      name: "Smart Casual",
      style: "casual",
      createdBy: {
        id: alice!.id,
        firstName: alice!.firstName,
        lastName: alice!.lastName,
        email: alice!.email,
      },
      items: [
        {
          id: woolJacket!.id,
          name: woolJacket!.name,
          price: woolJacket!.price,
          category: woolJacket!.category,
          brands: woolJacket!.brands,
          images: woolJacket!.images,
        },
        {
          id: straightJeans!.id,
          name: straightJeans!.name,
          price: straightJeans!.price,
          category: straightJeans!.category,
          brands: straightJeans!.brands,
          images: straightJeans!.images,
        },
        {
          id: whiteShirt!.id,
          name: whiteShirt!.name,
          price: whiteShirt!.price,
          category: whiteShirt!.category,
          brands: whiteShirt!.brands,
          images: whiteShirt!.images,
        },
      ],
      reviews: [
        {
          id: 1,
          score: 5,
          text: "Love this combination!",
          writtenBy: {
            id: bob!.id,
            firstName: bob!.firstName,
            lastName: bob!.lastName,
            email: bob!.email,
          },
          dateWritten: new Date("2024-01-15"),
        },
        {
          id: 2,
          score: 4,
          text: "Very clean look.",
          writtenBy: {
            id: carol!.id,
            firstName: carol!.firstName,
            lastName: carol!.lastName,
            email: carol!.email,
          },
          dateWritten: new Date("2024-01-16"),
        },
      ],
    },
    {
      id: 2,
      name: "Winter Ready",
      style: "winter",
      createdBy: {
        id: dave!.id,
        firstName: dave!.firstName,
        lastName: dave!.lastName,
        email: dave!.email,
      },
      items: [
        {
          id: woolJacket!.id,
          name: woolJacket!.name,
          price: woolJacket!.price,
          category: woolJacket!.category,
          brands: woolJacket!.brands,
          images: woolJacket!.images,
        },
        {
          id: leatherBoots!.id,
          name: leatherBoots!.name,
          price: leatherBoots!.price,
          category: leatherBoots!.category,
          brands: leatherBoots!.brands,
          images: leatherBoots!.images,
        },
      ],
      reviews: [
        {
          id: 3,
          score: 5,
          text: "Perfect for Copenhagen winters.",
          writtenBy: {
            id: alice!.id,
            firstName: alice!.firstName,
            lastName: alice!.lastName,
            email: alice!.email,
          },
          dateWritten: new Date("2024-02-01"),
        },
      ],
    },
  ]);
  console.log("[seed] outfits ✓");

  // ── done ──────────────────────────────────────────────────────────────────
  console.log("\n[seed] All collections seeded successfully ✓");
  
  // only disconnect if we triggered it manually not via test.
  if (!wasConnected && shouldDisconnect && !isTestRun) {
    const { disconnectMongo } = await import("../mongoose-client.js");
    await disconnectMongo();
  }
}

// Only auto-run when executed directly, not when imported
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seed().catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  });
}