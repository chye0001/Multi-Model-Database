import "dotenv/config";
import { randomUUID } from "crypto";
import type { HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";

import { connectMongo, disconnectMongo } from "../mongoose-client.js";
import {
  Country,
  Category,
  User,
  Brand,
  Item,
  Closet,
  Outfit,
  Role,
} from "../models/index.js";

import type {
  ICountry,
  ICategory,
  IBrand,
  IUser,
  IItem,
  IMongoRole,
} from "../models/index.js";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function must<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`[seed] Missing expected value: ${name}`);
  }
  return value;
}

function compactUser(user: HydratedDocument<IUser>) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

async function clearAll() {
  await Promise.all([
    Country.deleteMany({}),
    Category.deleteMany({}),
    Role.deleteMany({}),
    Brand.deleteMany({}),
    User.deleteMany({}),
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

  // 1) countries
  const countryDocs = (await Country.insertMany([
    { id: 1, name: "Denmark", countryCode: "DK" },
    { id: 2, name: "United States", countryCode: "US" },
  ])) as HydratedDocument<ICountry>[];

  const denmark = must(countryDocs[0], "denmark");
  const usa = must(countryDocs[1], "usa");
  console.log("[seed] countries ✓");

  // 2) categories
  const categoryDocs = (await Category.insertMany([
    { id: 1, name: "Tops" },
    { id: 2, name: "Bottoms" },
    { id: 3, name: "Outerwear" },
    { id: 4, name: "Footwear" },
  ])) as HydratedDocument<ICategory>[];

  const tops = must(categoryDocs[0], "tops");
  const bottoms = must(categoryDocs[1], "bottoms");
  const outerwear = must(categoryDocs[2], "outerwear");
  const footwear = must(categoryDocs[3], "footwear");
  console.log("[seed] categories ✓");

  // 3) roles
  const roleDocs = (await Role.insertMany([
    { id: 1, name: "admin" },
    { id: 2, name: "user" },
    { id: 3, name: "moderator" },
  ])) as HydratedDocument<IMongoRole>[];

  const adminRole = must(roleDocs[0], "adminRole");
  const userRole = must(roleDocs[1], "userRole");
  const moderatorRole = must(roleDocs[2], "moderatorRole");
  console.log("[seed] roles ✓");

  // 4) brands (embedded country required by schema)
  const brandDocs = (await Brand.insertMany([
    {
      id: 1,
      name: "Norse Projects",
      country: {
        id: denmark.id,
        name: denmark.name,
        countryCode: denmark.countryCode,
      },
    },
    {
      id: 2,
      name: "A.P.C.",
      country: {
        id: denmark.id,
        name: denmark.name,
        countryCode: denmark.countryCode,
      },
    },
  ])) as HydratedDocument<IBrand>[];

  const norseProjects = must(brandDocs[0], "norseProjects");
  const apc = must(brandDocs[1], "apc");
  console.log("[seed] brands ✓");

  // 5) users (embedded role + embedded country)
  const hashedPassword = await bcrypt.hash("test", 10);

  const userDocs = (await User.insertMany([
    {
      id: randomUUID(),
      email: "alice@example.com",
      password: hashedPassword,
      firstName: "Alice",
      lastName: "Smith",
      role: { id: adminRole.id, name: adminRole.name },
      country: {
        id: denmark.id,
        name: denmark.name,
        countryCode: denmark.countryCode,
      },
    },
    {
      id: randomUUID(),
      email: "bob@example.com",
      password: hashedPassword,
      firstName: "Bob",
      lastName: "Johnson",
      role: { id: userRole.id, name: userRole.name },
      country: {
        id: usa.id,
        name: usa.name,
        countryCode: usa.countryCode,
      },
    },
    {
      id: randomUUID(),
      email: "carol@example.com",
      password: hashedPassword,
      firstName: "Carol",
      lastName: "Williams",
      role: { id: userRole.id, name: userRole.name },
      country: {
        id: usa.id,
        name: usa.name,
        countryCode: usa.countryCode,
      },
    },
    {
      id: randomUUID(),
      email: "dave@example.com",
      password: hashedPassword,
      firstName: "Dave",
      lastName: "Brown",
      role: { id: moderatorRole.id, name: moderatorRole.name },
      country: {
        id: denmark.id,
        name: denmark.name,
        countryCode: denmark.countryCode,
      },
    },
  ])) as HydratedDocument<IUser>[];

  const alice = must(userDocs[0], "alice");
  const bob = must(userDocs[1], "bob");
  const carol = must(userDocs[2], "carol");
  const dave = must(userDocs[3], "dave");
  console.log("[seed] users ✓");

  // 6) items (embedded category + embedded brands)
  const itemDocs = (await Item.insertMany([
    {
      id: 1,
      name: "Wool Jacket",
      price: 1299.0,
      category: { categoryId: outerwear.id, name: outerwear.name },
      brands: [
        {
          id: norseProjects.id,
          name: norseProjects.name,
          country: { ...norseProjects.country },
        },
      ],
      images: [{ id: 1, url: "https://cdn.example.com/wool-jacket.jpg" }],
    },
    {
      id: 2,
      name: "Straight Jeans",
      price: 899.0,
      category: { categoryId: bottoms.id, name: bottoms.name },
      brands: [
        {
          id: apc.id,
          name: apc.name,
          country: { ...apc.country },
        },
      ],
      images: [{ id: 2, url: "https://cdn.example.com/straight-jeans.jpg" }],
    },
    {
      id: 3,
      name: "White Oxford Shirt",
      price: 599.0,
      category: { categoryId: tops.id, name: tops.name },
      brands: [
        {
          id: norseProjects.id,
          name: norseProjects.name,
          country: { ...norseProjects.country },
        },
        {
          id: apc.id,
          name: apc.name,
          country: { ...apc.country },
        },
      ],
      images: [{ id: 3, url: "https://cdn.example.com/white-shirt.jpg" }],
    },
    {
      id: 4,
      name: "Leather Chelsea Boots",
      price: 1599.0,
      category: { categoryId: footwear.id, name: footwear.name },
      brands: [
        {
          id: norseProjects.id,
          name: norseProjects.name,
          country: { ...norseProjects.country },
        },
      ],
      images: [{ id: 4, url: "https://cdn.example.com/chelsea-boots.jpg" }],
    },
  ])) as HydratedDocument<IItem>[];

  const woolJacket = must(itemDocs[0], "woolJacket");
  const straightJeans = must(itemDocs[1], "straightJeans");
  const whiteShirt = must(itemDocs[2], "whiteShirt");
  const leatherBoots = must(itemDocs[3], "leatherBoots");
  console.log("[seed] items ✓");

  // 7) closets (ObjectId refs + embedded sharedWith users)
  await Closet.insertMany([
    {
      id: 1,
      name: "Alice's Wardrobe",
      description: "My everyday essentials",
      isPublic: true,
      userId: alice._id,
      itemIds: [woolJacket._id, whiteShirt._id, leatherBoots._id],
      sharedWith: [compactUser(bob)],
    },
    {
      id: 2,
      name: "Bob's Casual Fits",
      description: null,
      isPublic: false,
      userId: bob._id,
      itemIds: [straightJeans._id, whiteShirt._id],
      sharedWith: [],
    },
  ]);
  console.log("[seed] closets ✓");

  // 8) outfits (embedded creator + embedded items + embedded review author)
  await Outfit.insertMany([
    {
      id: 1,
      name: "Smart Casual",
      style: "casual",
      createdBy: compactUser(alice),
      items: [woolJacket, straightJeans, whiteShirt].map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        brands: item.brands,
        images: item.images,
      })),
      reviews: [
        {
          id: 1,
          score: 5,
          text: "Love this combination!",
          writtenBy: compactUser(bob),
          dateWritten: new Date("2024-01-15"),
        },
        {
          id: 2,
          score: 4,
          text: "Very clean look.",
          writtenBy: compactUser(carol),
          dateWritten: new Date("2024-01-16"),
        },
      ],
    },
    {
      id: 2,
      name: "Winter Ready",
      style: "winter",
      createdBy: compactUser(dave),
      items: [woolJacket, leatherBoots].map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        brands: item.brands,
        images: item.images,
      })),
      reviews: [
        {
          id: 3,
          score: 5,
          text: "Perfect for Copenhagen winters.",
          writtenBy: compactUser(alice),
          dateWritten: new Date("2024-02-01"),
        },
      ],
    },
  ]);
  console.log("[seed] outfits ✓");

  console.log("\n[seed] All collections seeded successfully ✓");
  await disconnectMongo();
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
