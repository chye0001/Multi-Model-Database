import "dotenv/config";
/**
 * migrate.ts
 *
 * Reads all data from the Postgres (Prisma) database and writes it to:
 *   - MongoDB  (via Mongoose models)
 *   - Neo4j    (via Neogma models)
 *
 * Run after the Postgres seed has been applied and both MongoDB / Neo4j
 * are empty (or after running their respective truncate scripts).
 */


import { prisma } from "./postgres/prisma-client.js";
import { connectMongo, disconnectMongo } from "./mongo/mongoose-client.js";
import { connectNeo4j, disconnectNeo4j, neogma } from "./neo4j/neogma-client.js";

// ── Mongoose models ──────────────────────────────────────────────────────────
import { Country, Category, Brand, User, Item, Closet, Outfit, Role } from "./mongo/models/index.js";

// ── Neogma model getters ─────────────────────────────────────────────────────
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
} from "./neo4j/models/index.js";

import type {
  RoleInstance,
  CountryInstance,
  BrandInstance,
  CategoryInstance,
  UserInstance,
  ClosetInstance,
  ItemInstance,
  ImageInstance,
  OutfitInstance,
  ReviewInstance,
} from "./neo4j/models/index.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n⏳  ${label}`);
  try {
    await fn();
    console.log(`✅  ${label}`);
  } catch (err) {
    console.error(`❌  ${label} failed:`, err);
    throw err;
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function migrate() {
  console.log("🚀  Starting migration: Postgres → MongoDB + Neo4j\n");

  await connectMongo();
  await connectNeo4j();

  // ── Read all data from Postgres ───────────────────────────────────────────
  // Fetch everything upfront so we make one pass over the relational DB.
  // The includes mirror the relational schema's foreign keys and join tables.

  const [
    pgCountries,
    pgRoles,
    pgBrands,
    pgCategories,
    pgUsers,
    pgItems,
    pgClosets,
    pgOutfits,
    pgReviews,
    pgSharedClosets,
  ] = await Promise.all([
    prisma.country.findMany(),
    prisma.role.findMany(),
    prisma.brand.findMany(),
    prisma.category.findMany(),
    prisma.user.findMany(),
    prisma.item.findMany({
      include: {
        itemBrands: { include: { brand: true } },
        images:    true,
        category:  true,
      },
    }),
    prisma.closet.findMany({
      include: {
        closetItem: { include: { item: true } },
      },
    }),
    prisma.outfit.findMany({
      include: {
        outfitItems: {
          include: {
            closetItem: { include: { item: true } },
          },
        },
      },
    }),
    prisma.review.findMany(),
    prisma.sharedCloset.findMany(),
  ]);

  console.log(`📦  Loaded from Postgres:`);
  console.log(`    ${pgCountries.length} countries, ${pgRoles.length} roles, ${pgUsers.length} users`);
  console.log(`    ${pgBrands.length} brands, ${pgCategories.length} categories, ${pgItems.length} items`);
  console.log(`    ${pgClosets.length} closets, ${pgOutfits.length} outfits, ${pgReviews.length} reviews`);

  // ═══════════════════════════════════════════════════════════════════════════
  // MONGODB MIGRATION
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // MongoDB stores denormalised documents — relationships that are foreign keys
  // in Postgres become either embedded sub-documents or ObjectId references
  // depending on how frequently they're accessed together.

  console.log("\n──────────────────────────────────────");
  console.log("  MongoDB");
  console.log("──────────────────────────────────────");

  await step("Mongo: Countries", async () => {
    await Country.insertMany(
      pgCountries.map((c) => ({
        id:          c.id,
        name:        c.name,
        countryCode: c.countryCode,
      }))
    );
  });

  await step("Mongo: Categories", async () => {
    await Category.insertMany(
      pgCategories.map((c) => ({
        id:   c.id,
        name: c.name,
      }))
    );
  });

  // Brands — need the Mongo Country _id to store as a reference.
  // We build a lookup map: Postgres country id → Mongo country _id.
  const mongoCountries = await Country.find();
  const pgIdToMongoCountry = new Map(
    mongoCountries.map((c) => [c.id as number, c._id])
  );

  await step("Mongo: Brands", async () => {
    await Brand.insertMany(
      pgBrands.map((b) => ({
        id:        b.id,
        name:      b.name,
        countryId: pgIdToMongoCountry.get(b.countryId),
      }))
    );
  });

  // Users — embed role as sub-document (matches the Mongo schema).
  // Build role lookup: Postgres role id → role object
  const pgRoleMap = new Map(pgRoles.map((r) => [r.id, r]));

  const mongoCountriesMap = new Map(
    mongoCountries.map((c) => [c.id as number, c._id])
  );

  await step("Mongo: Users", async () => {
    await User.insertMany(
      pgUsers.map((u) => {
        const role = pgRoleMap.get(u.roleId)!;
        return {
          id:        u.id,           // UUID string from Postgres
          email:     u.email,
          password: u.password,
          firstName: u.firstName,
          lastName:  u.lastName,
          role: {
            id:   role.id,
            name: role.role,         // Prisma schema uses `role` field name
          },
          country: mongoCountriesMap.get(u.countryId),
        };
      })
    );
  });

  // Items — embed category, resolve brand ObjectIds from the join table,
  // and embed images as sub-documents.
  const mongoCategories    = await Category.find();
  const mongoCategoryMap   = new Map(mongoCategories.map((c) => [c.id as number, c._id]));

  const mongoBrands        = await Brand.find();
  const mongoBrandPgIdMap  = new Map(mongoBrands.map((b) => [b.id as number, b._id]));

  await step("Mongo: Items", async () => {
    await Item.insertMany(
      pgItems.map((item) => ({
        id:    Number(item.id),
        name:  item.name,
        price: item.price === null ? 0 : Number(item.price),
        category: {
          id:   item.category.id,
          name: item.category.name,
        },
        // Many-to-many brands via ItemBrand join table → array of ObjectIds
        brandIds: item.itemBrands.map((ib) =>
          mongoBrandPgIdMap.get(ib.brand.id)
        ).filter(Boolean),
        // Embed images as sub-documents (Mongo schema) — in Neo4j these are separate nodes.
        images: item.images.map((img) => ({
          id:  Number(img.id),
          url: img.url,
        })),
      }))
    );
  });

  // Closets — reference user and items by Mongo ObjectId.
  const mongoUsers    = await User.find();
  const mongoUserMap  = new Map(mongoUsers.map((u) => [u.id as string, u._id]));

  const mongoItems    = await Item.find();
  const mongoItemMap  = new Map(mongoItems.map((i) => [i.id as number, i._id]));

  await step("Mongo: Closets", async () => {
    await Closet.insertMany(
      pgClosets.map((cl) => ({
        id:          Number(cl.id),
        name:        cl.name,
        description: cl.description ?? "",
        isPublic:    cl.isPublic,
        userId:      mongoUserMap.get(
          // Postgres userId is an integer FK; User.id in Mongo is a UUID string.
          // Look up the Postgres user to get the UUID.
          pgUsers.find((u) => u.id === cl.userId)?.id ?? ""
        ),
        // Resolve ClosetItem join table → array of item ObjectIds
        itemIds: cl.closetItem.map((ci) =>
          mongoItemMap.get(Number(ci.item.id))
        ).filter(Boolean),
        sharedWith: pgSharedClosets
          .filter((sc) => Number(sc.closetId) === Number(cl.id))
          .map((sc) => ({
            userId: mongoUserMap.get(
              pgUsers.find((u) => u.id === sc.userId)?.id ?? ""
            ),
          })),
      }))
    );
  });

  // Outfits — embed reviews directly (matches Mongo schema).
  // Resolve items via OutfitItem → ClosetItem → Item chain.
  const mongoOutfitItems = await Item.find();
  const mongoOutfitItemMap = new Map(mongoOutfitItems.map((i) => [i.id as number, i._id]));

  // Build review lookup: outfitId → reviews[]
  const reviewsByOutfit = new Map<number, typeof pgReviews>();
  for (const review of pgReviews) {
    const list = reviewsByOutfit.get(Number(review.outfitId)) ?? [];
    list.push(review);
    reviewsByOutfit.set(Number(review.outfitId), list);
  }

  await step("Mongo: Outfits", async () => {
    await Outfit.insertMany(
      pgOutfits.map((outfit) => ({
        id:        Number(outfit.id),
        name:      outfit.name,
        style:     outfit.style,
        createdBy: mongoUserMap.get(
          pgUsers.find((u) => u.id === outfit.createdBy)?.id ?? ""
        ),
        // Flatten OutfitItem → ClosetItem → Item into direct item ObjectIds
        itemIds: outfit.outfitItems.map((oi) =>
          mongoOutfitItemMap.get(Number(oi.closetItem.item.id))
        ).filter(Boolean),
        // Embed reviews — in Postgres they're a separate table; here they're inline
        reviews: (reviewsByOutfit.get(Number(outfit.id)) ?? []).map((r) => ({
          id:          Number(r.id),
          score:       r.score,
          text:        r.text ?? "",
          writtenBy:   mongoUserMap.get(
            pgUsers.find((u) => u.id === r.writtenBy)?.id ?? ""
          ),
          dateWritten: r.dateWritten,
        })),
      }))
    );
  });

  await step("Mongo: Roles", async () => {
    await Role.insertMany(
      pgRoles.map((r) => ({
        id:   r.id,
        name: r.role,
      }))
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NEO4J MIGRATION
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Neo4j stores nodes and relationships. We create all nodes first, then
  // wire up relationships in a second pass — relateTo() needs both sides
  // to exist before it can create an edge.

  console.log("\n──────────────────────────────────────");
  console.log("  Neo4j");
  console.log("──────────────────────────────────────");

  const RoleModel     = getRoleModel();
  const CountryModel  = getCountryModel();
  const BrandModel    = getBrandModel();
  const CategoryModel = getCategoryModel();
  const UserModel     = getUserModel();
  const ClosetModel   = getClosetModel();
  const ItemModel     = getItemModel();
  const ImageModel    = getImageModel();
  const OutfitModel   = getOutfitModel();
  const ReviewModel   = getReviewModel();

  // ── Node creation ──────────────────────────────────────────────────────────
  // Keep instance maps so we can call .relateTo() in the relationship pass.

  const neo4jRoles     = new Map<number, RoleInstance>();
  const neo4jCountries = new Map<number, CountryInstance>();
  const neo4jBrands    = new Map<number, BrandInstance>();
  const neo4jCategories= new Map<number, CategoryInstance>();
  const neo4jUsers     = new Map<string, UserInstance>();   // keyed by UUID string
  const neo4jClosets   = new Map<number, ClosetInstance>();
  const neo4jItems     = new Map<number, ItemInstance>();
  const neo4jImages    = new Map<number, ImageInstance>();
  const neo4jOutfits   = new Map<number, OutfitInstance>();
  const neo4jReviews   = new Map<number, ReviewInstance>();

  await step("Neo4j: Roles", async () => {
    // Deduplicate roles — Prisma schema stores role as a string field on Role
    const seen = new Set<number>();
    for (const r of pgRoles) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      const node = await RoleModel.createOne({ id: r.id, name: r.role });
      neo4jRoles.set(r.id, node);
    }
  });

  await step("Neo4j: Countries", async () => {
    for (const c of pgCountries) {
      const node = await CountryModel.createOne({
        id:          c.id,
        name:        c.name,
        countryCode: c.countryCode,
      });
      neo4jCountries.set(c.id, node);
    }
  });

  await step("Neo4j: Brands", async () => {
    for (const b of pgBrands) {
      const node = await BrandModel.createOne({ id: b.id, name: b.name });
      neo4jBrands.set(b.id, node);
    }
  });

  await step("Neo4j: Brand → Country relationships", async () => {
    for (const b of pgBrands) {
      const brandNode   = neo4jBrands.get(b.id)!;
      const countryNode = neo4jCountries.get(b.countryId)!;
      await brandNode.relateTo({ alias: "country", where: { id: countryNode.id } });
    }
  });

  await step("Neo4j: Categories", async () => {
    for (const c of pgCategories) {
      const node = await CategoryModel.createOne({ id: c.id, name: c.name });
      neo4jCategories.set(c.id, node);
    }
  });

  await step("Neo4j: Images", async () => {
    // Images are stored as separate nodes in Neo4j (unlike Mongo where they're embedded).
    // Collect all images across all items and deduplicate by id.
    const seen = new Set<number>();
    for (const item of pgItems) {
      for (const img of item.images) {
        if (seen.has(Number(img.id))) continue;
        seen.add(Number(img.id));
        const node = await ImageModel.createOne({ id: Number(img.id), url: img.url });
        neo4jImages.set(Number(img.id), node);
      }
    }
  });

  await step("Neo4j: Items", async () => {
    for (const item of pgItems) {
      const node = await ItemModel.createOne({
        id:    Number(item.id),
        name:  item.name,
        price: item.price === null ? 0 : Number(item.price),
      });
      neo4jItems.set(Number(item.id), node);
    }
  });

  await step("Neo4j: Item relationships", async () => {
    for (const item of pgItems) {
      const itemNode = neo4jItems.get(Number(item.id))!;

      // (Item)-[:BELONGS_TO]->(Category)
      await itemNode.relateTo({
        alias: "category",
        where: { id: item.category.id },
      });

      // (Item)-[:BELONGS_TO]->(Brand)  — many-to-many via ItemBrand join table
      for (const ib of item.itemBrands) {
        await itemNode.relateTo({
          alias: "brand",
          where: { id: ib.brand.id },
        });
      }

      // (Item)-[:HAS]->(Image)
      for (const img of item.images) {
        await itemNode.relateTo({
          alias: "images",
          where: { id: Number(img.id) },
        });
      }
    }
  });

  await step("Neo4j: Users", async () => {
    for (const u of pgUsers) {
      const node = await UserModel.createOne({
        id:        u.id,           // UUID string
        firstName: u.firstName,
        lastName:  u.lastName,
        email: u.email,
        password: u.password,
        createdAt: u.createdAt.toISOString(),
      });
      neo4jUsers.set(u.id, node);
    }
  });

  await step("Neo4j: User relationships (role + country)", async () => {
    for (const u of pgUsers) {
      const userNode    = neo4jUsers.get(u.id)!;
      const roleNode    = neo4jRoles.get(u.roleId)!;
      const countryNode = neo4jCountries.get(u.countryId)!;

      await userNode.relateTo({ alias: "role",    where: { id: roleNode.id } });
      await userNode.relateTo({ alias: "country", where: { id: countryNode.id } });
    }
  });

  await step("Neo4j: Closets", async () => {
    for (const cl of pgClosets) {
      const node = await ClosetModel.createOne({
        id:          Number(cl.id),
        name:        cl.name,
        description: cl.description ?? "",
        isPublic:    cl.isPublic,
      });
      neo4jClosets.set(Number(cl.id), node);
    }
  });

  await step("Neo4j: Closet relationships", async () => {

    for (const cl of pgClosets) {
      const closetNode = neo4jClosets.get(Number(cl.id))!;

      // (User)-[:CREATES {createdAt}]->(Closet)
      const pgUser   = pgUsers.find((u) => u.id === cl.userId)!;
      const userNode = neo4jUsers.get(pgUser.id)!;
      await userNode.relateTo({
        alias:      "closets",
        where:      { id: closetNode.id },
        properties: { createdAt: cl.createdAt.toISOString() },
      });

      // (Closet)-[:STORES]->(Item)
      for (const ci of cl.closetItem) {
        await closetNode.relateTo({
          alias: "items",
          where: { id: Number(ci.item.id) },
        });
      }
    }
  });

  await step("Neo4j: Shared closet relationships", async () => {
    for (const sc of pgSharedClosets) {
        const pgUser   = pgUsers.find((u) => u.id === sc.userId)!;
        if (!pgUser) continue;
        const userNode = neo4jUsers.get(pgUser.id)!;

        await userNode.relateTo({
            alias: "sharedClosets",
            where: { id: Number(sc.closetId) },
        });
    }
  });

  await step("Neo4j: Outfits", async () => {
    for (const o of pgOutfits) {
      const node = await OutfitModel.createOne({
        id:    Number(o.id),
        name:  o.name,
        style: o.style,
      });
      neo4jOutfits.set(Number(o.id), node);
    }
  });

  await step("Neo4j: Outfit relationships", async () => {

    for (const o of pgOutfits) {
      const outfitNode = neo4jOutfits.get(Number(o.id))!;

      // (User)-[:CREATES]->(Outfit)
      const pgCreator  = pgUsers.find((u) => u.id === o.createdBy)!;
      const userNode   = neo4jUsers.get(pgCreator.id)!;
      await userNode.relateTo({ 
        alias: "outfits", 
        where: { id: outfitNode.id },
        properties: { createdAt: o.dateAdded.toISOString() }
      });

      // (Outfit)-[:CONTAINS]->(Item)
      // Flatten OutfitItem → ClosetItem → Item
      for (const oi of o.outfitItems) {
        await outfitNode.relateTo({
          alias: "items",
          where: { id: Number(oi.closetItem.item.id) },
        });
      }
    }
  });

  await step("Neo4j: Reviews", async () => {
    for (const r of pgReviews) {
      const node = await ReviewModel.createOne({
        id:    Number(r.id),
        score: r.score,
        text:  r.text ?? undefined,
      });
      neo4jReviews.set(Number(r.id), node);
    }
  });

  await step("Neo4j: Review relationships", async () => {
    for (const r of pgReviews) {
      const reviewNode = neo4jReviews.get(Number(r.id))!;
      const outfitNode = neo4jOutfits.get(Number(r.outfitId))!;
      const pgUser     = pgUsers.find((u) => u.id === r.writtenBy)!;
      const userNode   = neo4jUsers.get(pgUser.id)!;

      // (Review)-[:ABOUT]->(Outfit)
      await reviewNode.relateTo({ alias: "outfit", where: { id: outfitNode.id } });

      // (User)-[:WRITES {dateWritten}]->(Review)
      await userNode.relateTo({
        alias:      "reviews",
        where:      { id: reviewNode.id },
        properties: { dateWritten: r.dateWritten.toISOString() },
      });
    }
  });

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log("\n🎉  Migration complete!\n");

  await disconnectMongo();
  await disconnectNeo4j();
  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});