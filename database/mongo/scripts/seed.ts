import "dotenv/config";
import { randomUUID } from "crypto";
import { connectMongo, closeMongo } from "../mongoose-client.js";
import type { HydratedDocument } from "mongoose";

import { Country, Category, User, Brand, Item, Closet, Outfit } from "../models/index.js";
import type { ICountry, ICategory, IBrand, IUser, IItem  }  from "../models/index.js";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function clearAll() {
  await Promise.all([
    Country.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
    Brand.deleteMany({}),
    Item.deleteMany({}),
    Closet.deleteMany({}),
    Outfit.deleteMany({}),
  ]);
}

// ---------------------------------------------------------------------------
// seed
// ---------------------------------------------------------------------------

async function seed() {
  await connectMongo();
  await clearAll();

  // ── 1. countries ──────────────────────────────────────────────────────────
  const [denmark, usa] = await Country.insertMany([
    { id: randomUUID(), name: "Denmark",       countryCode: "DK" },
    { id: randomUUID(), name: "United States", countryCode: "US" },
  ]) as HydratedDocument<ICountry>[];
  console.log("[seed] countries ✓");

  // ── 2. categories ─────────────────────────────────────────────────────────
  const [tops, bottoms, outerwear, footwear] = await Category.insertMany([
    { id: randomUUID(), name: "Tops" },
    { id: randomUUID(), name: "Bottoms" },
    { id: randomUUID(), name: "Outerwear" },
    { id: randomUUID(), name: "Footwear" },
  ]) as HydratedDocument<ICategory>[];
  console.log("[seed] categories ✓");

  // ── 3. brands ─────────────────────────────────────────────────────────────
  const [norseProjects, apc] = await Brand.insertMany([
    { id: randomUUID(), name: "Norse Projects", countryId: denmark!._id },
    { id: randomUUID(), name: "A.P.C.",          countryId: denmark!._id },
  ]) as HydratedDocument<IBrand>[];
  console.log("[seed] brands ✓");

  // ── 4. users ──────────────────────────────────────────────────────────────
  // role is now embedded directly — no separate roles collection needed
  const [alice, bob, carol, dave] = await User.insertMany([
    {
      id: randomUUID(),
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Smith",
      role: { name: "admin" },
      countryId: denmark!._id,
    },
    {
      id: randomUUID(),
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Johnson",
      role: { name: "user" },
      countryId: usa!._id,
    },
    {
      id: randomUUID(),
      email: "carol@example.com",
      firstName: "Carol",
      lastName: "Williams",
      role: { name: "user" },
      countryId: usa!._id,
    },
    {
      id: randomUUID(),
      email: "dave@example.com",
      firstName: "Dave",
      lastName: "Brown",
      role: { name: "moderator" },
      countryId: denmark!._id,
    },
  ]) as HydratedDocument<IUser>[];
  console.log("[seed] users ✓");

  // ── 5. items ──────────────────────────────────────────────────────────────
  // category embeds both id (reference) and name (denormalised for fast reads)
  const [woolJacket, straightJeans, whiteShirt, leatherBoots] =
    await Item.insertMany([
      {
        id: randomUUID(),
        name: "Wool Jacket",
        price: 1299.0,
        category: { id: outerwear!.id, name: outerwear!.name },
        brandIds: [norseProjects!._id],
        images: [{ id: randomUUID(), url: "https://cdn.example.com/wool-jacket.jpg" }],
      },
      {
        id: randomUUID(),
        name: "Straight Jeans",
        price: 899.0,
        category: { id: bottoms!.id, name: bottoms!.name },
        brandIds: [apc!._id],
        images: [{ id: randomUUID(), url: "https://cdn.example.com/straight-jeans.jpg" }],
      },
      {
        id: randomUUID(),
        name: "White Oxford Shirt",
        price: 599.0,
        category: { id: tops!.id, name: tops!.name },
        brandIds: [norseProjects!._id, apc!._id],
        images: [{ id: randomUUID(), url: "https://cdn.example.com/white-shirt.jpg" }],
      },
      {
        id: randomUUID(),
        name: "Leather Chelsea Boots",
        price: 1599.0,
        category: { id: footwear!.id, name: footwear!.name },
        brandIds: [norseProjects!._id],
        images: [{ id: randomUUID(), url: "https://cdn.example.com/chelsea-boots.jpg" }],
      },
    ]) as HydratedDocument<IItem>[];
  console.log("[seed] items ✓");

  // ── 6. closets ────────────────────────────────────────────────────────────
  await Closet.insertMany([
    {
      id: randomUUID(),
      name: "Alice's Wardrobe",
      description: "My everyday essentials",
      isPublic: true,
      userId: alice!._id,
      itemIds: [woolJacket!._id, whiteShirt!._id, leatherBoots!._id],
      sharedWith: [{ userId: bob!._id }],
    },
    {
      id: randomUUID(),
      name: "Bob's Casual Fits",
      description: null,
      isPublic: false,
      userId: bob!._id,
      itemIds: [straightJeans!._id, whiteShirt!._id],
      sharedWith: [],
    },
  ]);
  console.log("[seed] closets ✓");

  // ── 7. outfits ────────────────────────────────────────────────────────────
  await Outfit.insertMany([
    {
      id: randomUUID(),
      name: "Smart Casual",
      style: "casual",
      createdBy: alice!._id,
      itemIds: [woolJacket!._id, straightJeans!._id, whiteShirt!._id],
      reviews: [
        {
          id: randomUUID(),
          score: 5,
          text: "Love this combination!",
          writtenBy: bob!._id,
        },
        {
          id: randomUUID(),
          score: 4,
          text: "Very clean look.",
          writtenBy: carol!._id,
        },
      ],
    },
    {
      id: randomUUID(),
      name: "Winter Ready",
      style: "winter",
      createdBy: dave!._id,
      itemIds: [woolJacket!._id, leatherBoots!._id],
      reviews: [
        {
          id: randomUUID(),
          score: 5,
          text: "Perfect for Copenhagen winters.",
          writtenBy: alice!._id,
        },
      ],
    },
  ]);
  console.log("[seed] outfits ✓");

  // ── done ──────────────────────────────────────────────────────────────────
  console.log("\n[seed] All collections seeded successfully ✓");
  await closeMongo();
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});