/**
 * seed.ts
 *
 * Populates the Neo4j database with a realistic sample dataset.
 *
 * Run order respects node dependencies — referenced nodes are always
 * created before the nodes / relationships that point to them.
 */

import { neogma } from "../neogma-client.js";

import { 
  getRoleModel, 
  getCountryModel, 
  getBrandModel, 
  getCategoryModel, 
  getUserModel, 
  getClosetModel, 
  getItemModel, 
  getImageModel, 
  getOutfitModel, 
  getReviewModel, 
} from "../models/index.js";

import type { 
  BrandInstance,
  CategoryInstance,
  ClosetInstance,
  CountryInstance, 
  ImageInstance, 
  ItemInstance, 
  OutfitInstance, 
  ReviewInstance, 
  RoleInstance, 
  UserInstance
} from "../models/index.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Wraps a seed step with a labelled log so failures are easy to trace. */
async function step(label: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n⏳  ${label}`);
  try {
    await fn();
    console.log(`✅  ${label}`);
  } catch (err) {
    console.error(`❌  ${label} failed:`, err); // <-- was silently swallowed before
    throw err; // <-- rethrow so the seed halts instead of continuing
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function seed() {
  console.log("🌱  Starting seed...");

  // ── 1. Roles ──────────────────────────────────────────────────────────────
  // Seeded first — Users reference Roles via (User)-[:HAS]->(Role).
  const RoleModel = getRoleModel();

  
  let roleAdmin: RoleInstance, roleUser: RoleInstance, roleMod: RoleInstance;

  await step("Roles", async () => {
    roleAdmin = await RoleModel.createOne({ id: 1, name: "admin" });
    roleUser  = await RoleModel.createOne({ id: 2, name: "user" });
    roleMod   = await RoleModel.createOne({ id: 3, name: "moderator" });
  });

  // ── 2. Countries ──────────────────────────────────────────────────────────
  // Both Users and Items point to Country.
  const CountryModel = getCountryModel();

  let countryDK: CountryInstance, countryUS: CountryInstance, countryIT: CountryInstance;

  await step("Countries", async () => {
    countryDK = await CountryModel.createOne({ id: 1, name: "Denmark",        countryCode: "DK" });
    countryUS = await CountryModel.createOne({ id: 2, name: "United States",  countryCode: "US" });
    countryIT = await CountryModel.createOne({ id: 3, name: "Italy",          countryCode: "IT" });
  });

  // ── 3. Brands ─────────────────────────────────────────────────────────────
  // Items reference Brands via (Item)-[:HAS]->(Brand).
  const BrandModel = getBrandModel();

  let brandNike: BrandInstance, brandZara: BrandInstance, brandGucci: BrandInstance;

  await step("Brands", async () => {
    brandNike  = await BrandModel.createOne({ id: 1, name: "Nike" });
    brandZara  = await BrandModel.createOne({ id: 2, name: "Zara" });
    brandGucci = await BrandModel.createOne({ id: 3, name: "Gucci" });
  });

  await step("Brand → Country relationships", async () => {
    // (Brand)-[:IS_FROM]->(Country)
    await brandNike.relateTo({  alias: "country", where: { id: countryUS.id } });
    await brandZara.relateTo({  alias: "country", where: { id: countryDK.id } });
    await brandGucci.relateTo({ alias: "country", where: { id: countryIT.id } });
  })

  // ── 4. Categories ─────────────────────────────────────────────────────────
  // Items reference Categories via (Item)-[:BELONGS_TO]->(Category).
  const CategoryModel = getCategoryModel();

  let catShoes: CategoryInstance, catTops: CategoryInstance, catPants: CategoryInstance;

  await step("Categories", async () => {
    catShoes = await CategoryModel.createOne({ id: 1, name: "Shoes" });
    catTops  = await CategoryModel.createOne({ id: 2, name: "Tops" });
    catPants = await CategoryModel.createOne({ id: 3, name: "Pants" });
  });

  // ── 5. Images ─────────────────────────────────────────────────────────────
  // Created before Items so we can attach them during Item creation.
  const ImageModel = getImageModel();

  let imgAirMax: ImageInstance, imgHoodie: ImageInstance, imgChinos: ImageInstance;

  await step("Images", async () => {
    imgAirMax = await ImageModel.createOne({ id: 1, url: "https://cdn.example.com/items/air-max.jpg" });
    imgHoodie = await ImageModel.createOne({ id: 2, url: "https://cdn.example.com/items/hoodie.jpg" });
    imgChinos = await ImageModel.createOne({ id: 3, url: "https://cdn.example.com/items/chinos.jpg" });
  });

  // ── 6. Items ──────────────────────────────────────────────────────────────
  // Create items, then wire up brand / category / image / country relationships.
  const ItemModel = getItemModel();

  let itemAirMax: ItemInstance, itemHoodie: ItemInstance, itemChinos: ItemInstance;

  await step("Items", async () => {
    itemAirMax = await ItemModel.createOne({ id: 1, name: "Air Max 90", price: 129.99 });
    itemHoodie = await ItemModel.createOne({ id: 2, name: "Classic Hoodie", price: 49.99 });
    itemChinos = await ItemModel.createOne({ id: 3, name: "Slim Chinos", price: 69.99 });
  });

  await step("Item relationships", async () => {
    // Air Max → Nike, Shoes, image, US
    await itemAirMax.relateTo({ alias: "brand",    where: { id: brandNike.id } });
    await itemAirMax.relateTo({ alias: "category", where: { id: catShoes.id } });
    await itemAirMax.relateTo({ alias: "images",   where: { id: imgAirMax.id } });
    // await itemAirMax.relateTo({ alias: "country",  where: { id: countryUS.id } });

    // Hoodie → Zara, Tops, image, DK
    await itemHoodie.relateTo({ alias: "brand",    where: { id: brandZara.id } });
    await itemHoodie.relateTo({ alias: "category", where: { id: catTops.id } });
    await itemHoodie.relateTo({ alias: "images",   where: { id: imgHoodie.id } });
    // await itemHoodie.relateTo({ alias: "country",  where: { id: countryDK.id } });

    // Chinos → Gucci, Pants, image, IT
    await itemChinos.relateTo({ alias: "brand",    where: { id: brandGucci.id } });
    await itemChinos.relateTo({ alias: "category", where: { id: catPants.id } });
    await itemChinos.relateTo({ alias: "images",   where: { id: imgChinos.id } });
    // await itemChinos.relateTo({ alias: "country",  where: { id: countryIT.id } });
  });

  // ── 7. Users ──────────────────────────────────────────────────────────────
  // id is a string here (UUID-style) to match your User schema.
  const UserModel = getUserModel();

  let userAlice: UserInstance, userBob: UserInstance;

  await step("Users", async () => {
    userAlice = await UserModel.createOne({
      id:        "user-001",
      firstName: "Alice",
      lastName:  "Jensen",
      email:     "alice@example.com",
    });

    userBob = await UserModel.createOne({
      id:        "user-002",
      firstName: "Bob",
      lastName:  "Smith",
      email:     "bob@example.com",
    });
  });

  await step("User relationships (role + country)", async () => {
    // Alice → admin, Denmark
    await userAlice.relateTo({ alias: "role",    where: { id: roleAdmin.id } });
    await userAlice.relateTo({ alias: "country", where: { id: countryDK.id } });

    // Bob → user, United States
    await userBob.relateTo({ alias: "role",    where: { id: roleUser.id } });
    await userBob.relateTo({ alias: "country", where: { id: countryUS.id } });
  });

  // ── 8. Closets ────────────────────────────────────────────────────────────
  // Created after Users so we can link (User)-[:HAS]->(Closet).
  // The HAS relationship carries a createdAt timestamp.
  const ClosetModel = getClosetModel();

  let closetSummer: ClosetInstance, closetFormal: ClosetInstance;

  await step("Closets", async () => {
    closetSummer = await ClosetModel.createOne({
      id:          1,
      name:        "Summer 2025",
      description: "Light and breezy looks for the warmer months",
      isPublic:    true,
    });

    closetFormal = await ClosetModel.createOne({
      id:          2,
      name:        "Office Essentials",
      description: "Smart-casual pieces for the working week",
      isPublic:    false,
    });
  });

  await step("User → Closet relationships", async () => {
    // (User)-[:HAS {createdAt}]->(Closet)
    await userAlice.relateTo({
      alias: "closets",
      where: { id: closetSummer.id },
      properties: { createdAt: new Date().toISOString() },
    });

    await userBob.relateTo({
      alias: "closets",
      where: { id: closetFormal.id },
      properties: { createdAt: new Date().toISOString() },
    });
  });

  await step("Closet → Item relationships", async () => {
    // (Closet)-[:STORES]->(Item)
    await closetSummer.relateTo({ alias: "items", where: { id: itemAirMax.id } });
    await closetSummer.relateTo({ alias: "items", where: { id: itemHoodie.id } });

    await closetFormal.relateTo({ alias: "items", where: { id: itemChinos.id } });
    await closetFormal.relateTo({ alias: "items", where: { id: itemHoodie.id } });
  });

  // ── 9. Outfits ────────────────────────────────────────────────────────────
  const OutfitModel = getOutfitModel();

  let outfitCasual: OutfitInstance, outfitSmart: OutfitInstance;

  await step("Outfits", async () => {
    outfitCasual = await OutfitModel.createOne({ id: 1, name: "Weekend Casual", style: "casual" });
    outfitSmart  = await OutfitModel.createOne({ id: 2, name: "Smart Friday",   style: "smart-casual" });
  });

  await step("Outfit → Item relationships", async () => {
    // (Outfit)-[:CONTAINS]->(Item)
    await outfitCasual.relateTo({ alias: "items", where: { id: itemAirMax.id } });
    await outfitCasual.relateTo({ alias: "items", where: { id: itemHoodie.id } });

    await outfitSmart.relateTo({ alias: "items", where: { id: itemChinos.id } });
    await outfitSmart.relateTo({ alias: "items", where: { id: itemHoodie.id } });
  });

  await step("User → Outfit (CREATES) + Closet → Outfit (CREATES) relationships", async () => {
    const now = new Date().toISOString();

    // (User)-[:CREATES]->(Outfit)
    await userAlice.relateTo({ alias: "outfits", where: { id: outfitCasual.id } });
    await userBob.relateTo({   alias: "outfits", where: { id: outfitSmart.id  } });
  });

  // ── 10. Reviews ───────────────────────────────────────────────────────────
  // (User)-[:WRITES {dateWritten}]->(Review)-[:ABOUT]->(Outfit)
  const ReviewModel = getReviewModel();

  let reviewOne: ReviewInstance, reviewTwo: ReviewInstance;

  await step("Reviews", async () => {
    reviewOne = await ReviewModel.createOne({ id: 1, score: 5, text: "Love this combination — very versatile!" });
    reviewTwo = await ReviewModel.createOne({ id: 2, score: 4, text: "Great for the office, very comfortable." });
  });

  await step("Review relationships", async () => {
    const now = new Date().toISOString();

    // (Review)-[:ABOUT]->(Outfit)
    await reviewOne.relateTo({ alias: "outfit", where: { id: outfitCasual.id } });
    await reviewTwo.relateTo({ alias: "outfit", where: { id: outfitSmart.id  } });

    // (User)-[:WRITES {dateWritten}]->(Review)
    await userAlice.relateTo({
      alias:      "reviews",
      where:      { id: reviewOne.id },
      properties: { dateWritten: now },
    });
    await userBob.relateTo({
      alias:      "reviews",
      where:      { id: reviewTwo.id },
      properties: { dateWritten: now },
    });
  });

  // ─────────────────────────────────────────────
  console.log("\n🎉  Seed complete!\n");
  await neogma.driver.close();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});