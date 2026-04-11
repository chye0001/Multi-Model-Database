import "dotenv/config";
import { randomUUID } from "crypto";
import { connectMongo, disconnectMongo } from "../mongoose-client.js";
import type { HydratedDocument } from "mongoose";

import { Country, Category, User, Brand, Item, Closet, Outfit, Role } from "../models/index.js";
import type { ICountry, ICategory, IBrand, IUser, IItem } from "../models/index.js";

import bcrypt from "bcrypt";

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
    { id: 1, name: "Norse Projects", countryId: denmark!._id },
    { id: 2, name: "A.P.C.",          countryId: denmark!._id },
  ]) as HydratedDocument<IBrand>[];
  console.log("[seed] brands ✓");

  // ── 4. users ──────────────────────────────────────────────────────────────
  // id stays UUID — all other ids are now numbers

  const hashedPassword = await bcrypt.hash("test", 10);

  const [alice, bob, carol, dave] = await User.insertMany([
    {
      id: randomUUID(),
      email: "alice@example.com",
      password: hashedPassword,
      firstName: "Alice",
      lastName: "Smith",
      role: { id: 1, name: "admin" },
      country: denmark!._id,
    },
    {
      id: randomUUID(),
      email: "bob@example.com",
      password: hashedPassword,
      firstName: "Bob",
      lastName: "Johnson",
      role: { id: 2, name: "user" },
      country: usa!._id,
    },
    {
      id: randomUUID(),
      email: "carol@example.com",
      password: hashedPassword,
      firstName: "Carol",
      lastName: "Williams",
      role: { id: 2, name: "user" },
      country: usa!._id,
    },
    {
      id: randomUUID(),
      email: "dave@example.com",
      password: hashedPassword,
      firstName: "Dave",
      lastName: "Brown",
      role: { id: 3, name: "moderator" },
      country: denmark!._id,
    },
  ]) as HydratedDocument<IUser>[];
  console.log("[seed] users ✓");

  // ── 5. items ──────────────────────────────────────────────────────────────
  const [woolJacket, straightJeans, whiteShirt, leatherBoots] =
    await Item.insertMany([
      {
        id: 1,
        name: "Wool Jacket",
        price: 1299.0,
        category: { id: outerwear!.id, name: outerwear!.name },
        brandIds: [norseProjects!._id],
        images: [{ id: 1, url: "https://cdn.example.com/wool-jacket.jpg" }],
      },
      {
        id: 2,
        name: "Straight Jeans",
        price: 899.0,
        category: { id: bottoms!.id, name: bottoms!.name },
        brandIds: [apc!._id],
        images: [{ id: 2, url: "https://cdn.example.com/straight-jeans.jpg" }],
      },
      {
        id: 3,
        name: "White Oxford Shirt",
        price: 599.0,
        category: { id: tops!.id, name: tops!.name },
        brandIds: [norseProjects!._id, apc!._id],
        images: [{ id: 3, url: "https://cdn.example.com/white-shirt.jpg" }],
      },
      {
        id: 4,
        name: "Leather Chelsea Boots",
        price: 1599.0,
        category: { id: footwear!.id, name: footwear!.name },
        brandIds: [norseProjects!._id],
        images: [{ id: 4, url: "https://cdn.example.com/chelsea-boots.jpg" }],
      },
    ]) as HydratedDocument<IItem>[];
  console.log("[seed] items ✓");

  // ── 6. closets ────────────────────────────────────────────────────────────
  await Closet.insertMany([
    {
      id: 1,
      name: "Alice's Wardrobe",
      description: "My everyday essentials",
      isPublic: true,
      userId: alice!._id,
      itemIds: [woolJacket!._id, whiteShirt!._id, leatherBoots!._id],
      sharedWith: [{ userId: bob!._id }],
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

  // ── 7. outfits ────────────────────────────────────────────────────────────
  await Outfit.insertMany([
    {
      id: 1,
      name: "Smart Casual",
      style: "casual",
      createdBy: alice!._id,
      itemIds: [woolJacket!._id, straightJeans!._id, whiteShirt!._id],
      reviews: [
        {
          id: 1,
          score: 5,
          text: "Love this combination!",
          writtenBy: bob!._id,
          dateWritten: new Date("2024-01-15"),
        },
        {
          id: 2,
          score: 4,
          text: "Very clean look.",
          writtenBy: carol!._id,
          dateWritten: new Date("2024-01-16"),
        },
      ],
    },
    {
      id: 2,
      name: "Winter Ready",
      style: "winter",
      createdBy: dave!._id,
      itemIds: [woolJacket!._id, leatherBoots!._id],
      reviews: [
        {
          id: 3,
          score: 5,
          text: "Perfect for Copenhagen winters.",
          writtenBy: alice!._id,
          dateWritten: new Date("2024-02-01"),
        },
      ],
    },
  ]);
  console.log("[seed] outfits ✓");

  // ── Roles ──────────────────────────────────────────────────────────────────
  await Role.insertMany([
    { id: 1, name: "admin" },
    { id: 2, name: "user" },
    { id: 3, name: "moderator" },
  ]);
  console.log("[seed] roles ✓");

  // ── done ──────────────────────────────────────────────────────────────────
  console.log("\n[seed] All collections seeded successfully ✓");
  await disconnectMongo();
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});