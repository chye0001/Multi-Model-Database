import "dotenv/config";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { prisma } from "../prisma-client.js";

// ── CONFIGURATION ────────────────────────────────────────────────────────────
// Adjust these numbers to control how much data gets seeded
const CONFIG = {
  users:               100,  // number of users to create
  items:               100,  // number of items to create
  closets:             2500,  // number of closets to create (spread across users)
  // outfits:             10,  // number of outfits to create
  reviews:             10,  // number of reviews (one per outfit)
  itemsPerCloset:       5,  // how many items to add to each closet
  itemsPerOutfit:       3,  // how many closet items to add to each outfit
  brandsPerItem:        2,  // max number of brands assigned to each item (min is always 1)
  sharedClosetsPerUser: 3,  // how many closets each user gets shared with them (from other users)
  outfitsPerUser:       100,  // how many outfits a single user has
};
// ─────────────────────────────────────────────────────────────────────────────

// Utility: pick a random element from an array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Utility: pick N unique random elements from an array
const pickN = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
};

// Utility: short uuid suffix for unique names
const uid = () => randomUUID().split("-")[0];

async function seed() {

  const hashedPassword = await bcrypt.hash("test", 10);

  // ── 1. STATIC REFERENCE DATA ─────────────────────────────────────────────
  // These are always created as-is — they are lookup tables, not stress data

  const [usa, denmark, germany, france, sweden] = await Promise.all([
    prisma.country.create({ data: { name: "United States", countryCode: "US" } }),
    prisma.country.create({ data: { name: "Denmark",       countryCode: "DK" } }),
    prisma.country.create({ data: { name: "Germany",       countryCode: "DE" } }),
    prisma.country.create({ data: { name: "France",        countryCode: "FR" } }),
    prisma.country.create({ data: { name: "Sweden",        countryCode: "SE" } }),
  ]);
  const countries = [usa, denmark, germany, france, sweden];

  const [adminRole, userRole] = await Promise.all([
    prisma.role.create({ data: { role: "admin" } }),
    prisma.role.create({ data: { role: "user"  } }),
  ]);

  const [nike, adidas, ganni, apc, acneStudios] = await Promise.all([
    prisma.brand.create({ data: { name: "Nike",        countryId: usa.id     } }),
    prisma.brand.create({ data: { name: "Adidas",      countryId: germany.id } }),
    prisma.brand.create({ data: { name: "Ganni",       countryId: denmark.id } }),
    prisma.brand.create({ data: { name: "A.P.C.",      countryId: france.id  } }),
    prisma.brand.create({ data: { name: "Acne Studios",countryId: sweden.id  } }),
  ]);
  const brands = [nike, adidas, ganni, apc, acneStudios];

  const [shoes, clothing, accessories, outerwear, activewear] = await Promise.all([
    prisma.category.create({ data: { name: "Shoes"       } }),
    prisma.category.create({ data: { name: "Clothing"    } }),
    prisma.category.create({ data: { name: "Accessories" } }),
    prisma.category.create({ data: { name: "Outerwear"   } }),
    prisma.category.create({ data: { name: "Activewear"  } }),
  ]);
  const categories = [shoes, clothing, accessories, outerwear, activewear];

  // ── 2. USERS (configurable) ───────────────────────────────────────────────
  console.log(`🌱 Seeding ${CONFIG.users} users...`);

  const users = await Promise.all(
    Array.from({ length: CONFIG.users }, (_, i) => {
      const id = uid();
      return prisma.user.create({
        data: {
          email:     `user-${id}@example.com`,
          password:  hashedPassword,
          firstName: `First-${id}`,
          lastName:  `Last-${id}`,
          roleId:    i === 0 ? adminRole.id : userRole.id, // first user is admin
          countryId: pick(countries).id,
        },
      });
    })
  );

  // ── 3. ITEMS (configurable) ───────────────────────────────────────────────
  console.log(`🌱 Seeding ${CONFIG.items} items...`);

  const itemNames = [
    "Sneaker", "Hoodie", "Watch", "Jacket", "Dress",
    "Shorts",  "Blouse", "Coat",  "Boots",  "Cap",
    "Jeans",   "Shirt",  "Bag",   "Belt",   "Scarf",
  ];
  const randomPrice = () => Math.floor(Math.random() * 500_000);

  const items = await Promise.all(
    Array.from({ length: CONFIG.items }, () => {
      const id = uid();
      return prisma.item.create({
        data: {
          name:       `${pick(itemNames)}-${id}`,
          price:      randomPrice(),
          categoryId: pick(categories).id,
        },
      });
    })
  );

  // Assign 1-N random brands to each item (capped by CONFIG.brandsPerItem)
  await Promise.all(
    items.flatMap((item) => {
      const count = Math.max(1, Math.floor(Math.random() * CONFIG.brandsPerItem) + 1);
      const assignedBrands = pickN(brands, count);
      return assignedBrands.map((brand) =>
        prisma.itemBrand.create({ data: { itemId: item.id, brandId: brand.id } })
      );
    })
  );

  // ── 4. CLOSETS (configurable) ─────────────────────────────────────────────
  console.log(`🌱 Seeding ${CONFIG.closets} closets...`);

  const styles = ["Streetwear", "Minimalist", "Bohemian", "Formal", "Sporty"];

  const closets = await Promise.all(
    Array.from({ length: CONFIG.closets }, () => {
      const id = uid();
      return prisma.closet.create({
        data: {
          name:        `Closet-${id}`,
          description: `Auto-generated closet ${id}`,
          isPublic:    Math.random() > 0.5,
          userId:      pick(users).id,
        },
      });
    })
  );

  // Add items to each closet
  const closetItemsCreated = [];
  for (const closet of closets) {
    const selectedItems = pickN(items, CONFIG.itemsPerCloset);
    const created = await Promise.all(
      selectedItems.map((item) =>
        prisma.closetItem.create({ data: { itemId: item.id, closetId: closet.id } })
      )
    );
    closetItemsCreated.push(...created);
  }

  // ── 5. OUTFITS (configurable) ─────────────────────────────────────────────
  console.log(`🌱 Seeding ${users.length * CONFIG.outfitsPerUser} outfits...`);

  const outfits = await Promise.all(
    users.flatMap((user) =>
      Array.from({ length: CONFIG.outfitsPerUser }, () => {
        const id = uid();
        return prisma.outfit.create({
          data: {
            name:      `Outfit-${id}`,
            style:     pick(styles),
            createdBy: user.id,
          },
        });
      })
    )
  );

  // Add closet items to each outfit
  for (const outfit of outfits) {
    const selectedClosetItems = pickN(closetItemsCreated, CONFIG.itemsPerOutfit);
    await Promise.all(
      selectedClosetItems.map((ci) =>
        prisma.outfitItem.create({ data: { outfitId: outfit.id, closetItemId: ci.id } })
      )
    );
  }

  // ── 6. REVIEWS (configurable) ─────────────────────────────────────────────
  console.log(`🌱 Seeding ${CONFIG.reviews} reviews...`);

  const reviewTexts = [
    "Absolutely love this!", "Great quality, would buy again.",
    "Decent but a bit pricey.", "Exceeded my expectations!",
    "Fits perfectly, very happy.", "Bold choices but it works.",
    "The color palette is chef's kiss.", "Amazing and super comfortable.",
  ];

  await Promise.all(
    Array.from({ length: CONFIG.reviews }, (_, i) => {
      return prisma.review.create({
        data: {
          score:     Math.floor(Math.random() * 2) + 4, // 4 or 5
          text:      pick(reviewTexts),
          writtenBy: pick(users).id,
          outfitId:  outfits[i % outfits.length].id,
        },
      });
    })
  );

  // ── 7. SHARED CLOSETS (configurable) ─────────────────────────────────────
  // For each user, share N random closets FROM other users WITH them.
  // Tracks already-created (closetId, userId) pairs to avoid unique constraint violations.
  console.log(`🌱 Seeding shared closets (${CONFIG.sharedClosetsPerUser} per user)...`);

  const sharedPairs = new Set(); // tracks "closetId:userId" to avoid duplicates
  let sharedClosetCount = 0;

  for (const user of users) {
    // Only share closets that belong to OTHER users
    const otherUsersClosets = closets.filter((c) => c.userId !== user.id);
    const toShare = pickN(otherUsersClosets, CONFIG.sharedClosetsPerUser);

    for (const closet of toShare) {
      const pairKey = `${closet.id}:${user.id}`;
      if (sharedPairs.has(pairKey)) continue; // skip duplicate
      sharedPairs.add(pairKey);

      await prisma.sharedCloset.create({
        data: { closetId: closet.id, userId: user.id },
      });
      sharedClosetCount++;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("✅ Stress seed complete!");
  console.table({
    countries:   5,
    roles:       2,
    brands:      5,
    categories:  5,
    users:       users.length,
    items:       items.length,
    closets:     closets.length,
    closetItems: closetItemsCreated.length,
    outfits: users.length * CONFIG.outfitsPerUser,
    outfitItems:   users.length * CONFIG.outfitsPerUser * CONFIG.itemsPerOutfit,
    reviews:       CONFIG.reviews,
    sharedClosets: sharedClosetCount,
  });
}

seed()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });