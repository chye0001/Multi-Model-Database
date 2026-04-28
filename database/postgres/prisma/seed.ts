import "dotenv/config";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { prisma } from "../prisma-client.js";

// ── CONFIGURATION ────────────────────────────────────────────────────────────
// Adjust these numbers to control how much data gets seeded
const CONFIG = {
  users:               100,  // number of users to create
  items:               10000,  // number of items to create
  closets:             100,  // number of closets to create (spread across users)
  // outfits:             10,  // number of outfits to create
  reviews:             100,  // number of reviews (one per outfit)
  itemsPerCloset:       100,  // how many items to add to each closet
  itemsPerOutfit:       10,  // how many closet items to add to each outfit
  brandsPerItem:        2,  // max number of brands assigned to each item (min is always 1)
  sharedClosetsPerUser: 10,  // how many closets each user gets shared with them (from other users)
  outfitsPerUser:       10,  // how many outfits a single user has
};
// ─────────────────────────────────────────────────────────────────────────────

// Utility: pick a random element from an array
//@ts-ignore
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Utility: pick N unique random elements from an array
//@ts-ignore
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

  const countries = await Promise.all([
    // Europe
    prisma.country.create({ data: { name: "Denmark",        countryCode: "DK" } }),
    prisma.country.create({ data: { name: "Sweden",         countryCode: "SE" } }),
    prisma.country.create({ data: { name: "Norway",         countryCode: "NO" } }),
    prisma.country.create({ data: { name: "Finland",        countryCode: "FI" } }),
    prisma.country.create({ data: { name: "Germany",        countryCode: "DE" } }),
    prisma.country.create({ data: { name: "France",         countryCode: "FR" } }),
    prisma.country.create({ data: { name: "Italy",          countryCode: "IT" } }),
    prisma.country.create({ data: { name: "Spain",          countryCode: "ES" } }),
    prisma.country.create({ data: { name: "Portugal",       countryCode: "PT" } }),
    prisma.country.create({ data: { name: "Netherlands",    countryCode: "NL" } }),
    prisma.country.create({ data: { name: "Belgium",        countryCode: "BE" } }),
    prisma.country.create({ data: { name: "Switzerland",    countryCode: "CH" } }),
    prisma.country.create({ data: { name: "Austria",        countryCode: "AT" } }),
    prisma.country.create({ data: { name: "United Kingdom", countryCode: "GB" } }),
    prisma.country.create({ data: { name: "Poland",         countryCode: "PL" } }),
    // Americas
    prisma.country.create({ data: { name: "United States",  countryCode: "US" } }),
    prisma.country.create({ data: { name: "Canada",         countryCode: "CA" } }),
    prisma.country.create({ data: { name: "Brazil",         countryCode: "BR" } }),
    prisma.country.create({ data: { name: "Mexico",         countryCode: "MX" } }),
    prisma.country.create({ data: { name: "Argentina",      countryCode: "AR" } }),
    // Asia
    prisma.country.create({ data: { name: "Japan",          countryCode: "JP" } }),
    prisma.country.create({ data: { name: "South Korea",    countryCode: "KR" } }),
    prisma.country.create({ data: { name: "China",          countryCode: "CN" } }),
    prisma.country.create({ data: { name: "India",          countryCode: "IN" } }),
    prisma.country.create({ data: { name: "Vietnam",        countryCode: "VN" } }),
    prisma.country.create({ data: { name: "Thailand",       countryCode: "TH" } }),
    prisma.country.create({ data: { name: "Turkey",         countryCode: "TR" } }),
    // Oceania & Africa
    prisma.country.create({ data: { name: "Australia",      countryCode: "AU" } }),
    prisma.country.create({ data: { name: "New Zealand",    countryCode: "NZ" } }),
    prisma.country.create({ data: { name: "South Africa",   countryCode: "ZA" } }),
  ]);

  const [adminRole, userRole] = await Promise.all([
    prisma.role.create({ data: { role: "admin" } }),
    prisma.role.create({ data: { role: "user"  } }),
  ]);

  // Build a lookup map for easy country retrieval by code
  const countryMap = new Map(countries.map((c) => [c.countryCode, c]));
  
  const brands = await Promise.all([
    // American brands
    prisma.brand.create({ data: { name: "Nike",              countryId: countryMap.get("US")!.id } }),
    prisma.brand.create({ data: { name: "Ralph Lauren",      countryId: countryMap.get("US")!.id } }),
    prisma.brand.create({ data: { name: "Calvin Klein",      countryId: countryMap.get("US")!.id } }),
    prisma.brand.create({ data: { name: "Tommy Hilfiger",    countryId: countryMap.get("US")!.id } }),
    prisma.brand.create({ data: { name: "Coach",             countryId: countryMap.get("US")!.id } }),
    prisma.brand.create({ data: { name: "Marc Jacobs",       countryId: countryMap.get("US")!.id } }),
    prisma.brand.create({ data: { name: "Michael Kors",      countryId: countryMap.get("US")!.id } }),
    // German brands
    prisma.brand.create({ data: { name: "Adidas",            countryId: countryMap.get("DE")!.id } }),
    prisma.brand.create({ data: { name: "Puma",              countryId: countryMap.get("DE")!.id } }),
    prisma.brand.create({ data: { name: "Hugo Boss",         countryId: countryMap.get("DE")!.id } }),
    prisma.brand.create({ data: { name: "Birkenstock",       countryId: countryMap.get("DE")!.id } }),
    // French brands
    prisma.brand.create({ data: { name: "Louis Vuitton",     countryId: countryMap.get("FR")!.id } }),
    prisma.brand.create({ data: { name: "Chanel",            countryId: countryMap.get("FR")!.id } }),
    prisma.brand.create({ data: { name: "Dior",              countryId: countryMap.get("FR")!.id } }),
    prisma.brand.create({ data: { name: "Hermès",            countryId: countryMap.get("FR")!.id } }),
    prisma.brand.create({ data: { name: "A.P.C.",            countryId: countryMap.get("FR")!.id } }),
    prisma.brand.create({ data: { name: "Jacquemus",         countryId: countryMap.get("FR")!.id } }),
    prisma.brand.create({ data: { name: "Isabel Marant",     countryId: countryMap.get("FR")!.id } }),
    // Italian brands
    prisma.brand.create({ data: { name: "Gucci",             countryId: countryMap.get("IT")!.id } }),
    prisma.brand.create({ data: { name: "Prada",             countryId: countryMap.get("IT")!.id } }),
    prisma.brand.create({ data: { name: "Versace",           countryId: countryMap.get("IT")!.id } }),
    prisma.brand.create({ data: { name: "Fendi",             countryId: countryMap.get("IT")!.id } }),
    prisma.brand.create({ data: { name: "Armani",            countryId: countryMap.get("IT")!.id } }),
    prisma.brand.create({ data: { name: "Bottega Veneta",    countryId: countryMap.get("IT")!.id } }),
    prisma.brand.create({ data: { name: "Valentino",         countryId: countryMap.get("IT")!.id } }),
    prisma.brand.create({ data: { name: "Stone Island",      countryId: countryMap.get("IT")!.id } }),
    // Scandinavian brands
    prisma.brand.create({ data: { name: "Ganni",             countryId: countryMap.get("DK")!.id } }),
    prisma.brand.create({ data: { name: "Samsøe Samsøe",    countryId: countryMap.get("DK")!.id } }),
    prisma.brand.create({ data: { name: "Acne Studios",      countryId: countryMap.get("SE")!.id } }),
    prisma.brand.create({ data: { name: "Weekday",           countryId: countryMap.get("SE")!.id } }),
    prisma.brand.create({ data: { name: "Our Legacy",        countryId: countryMap.get("SE")!.id } }),
    prisma.brand.create({ data: { name: "Filippa K",         countryId: countryMap.get("SE")!.id } }),
    prisma.brand.create({ data: { name: "Norse Projects",    countryId: countryMap.get("DK")!.id } }),
    // British brands
    prisma.brand.create({ data: { name: "Burberry",          countryId: countryMap.get("GB")!.id } }),
    prisma.brand.create({ data: { name: "Paul Smith",        countryId: countryMap.get("GB")!.id } }),
    prisma.brand.create({ data: { name: "Barbour",           countryId: countryMap.get("GB")!.id } }),
    prisma.brand.create({ data: { name: "Dr. Martens",       countryId: countryMap.get("GB")!.id } }),
    prisma.brand.create({ data: { name: "Alexander McQueen", countryId: countryMap.get("GB")!.id } }),
    // Japanese brands
    prisma.brand.create({ data: { name: "Comme des Garçons", countryId: countryMap.get("JP")!.id } }),
    prisma.brand.create({ data: { name: "Issey Miyake",      countryId: countryMap.get("JP")!.id } }),
    prisma.brand.create({ data: { name: "Uniqlo",            countryId: countryMap.get("JP")!.id } }),
    prisma.brand.create({ data: { name: "Yohji Yamamoto",    countryId: countryMap.get("JP")!.id } }),
    // Spanish brands
    prisma.brand.create({ data: { name: "Zara",              countryId: countryMap.get("ES")!.id } }),
    prisma.brand.create({ data: { name: "Mango",             countryId: countryMap.get("ES")!.id } }),
    prisma.brand.create({ data: { name: "Balenciaga",        countryId: countryMap.get("ES")!.id } }),
    // Belgian brands
    prisma.brand.create({ data: { name: "Maison Margiela",   countryId: countryMap.get("BE")!.id } }),
    prisma.brand.create({ data: { name: "Dries Van Noten",   countryId: countryMap.get("BE")!.id } }),
    // Swiss brands
    prisma.brand.create({ data: { name: "On Running",        countryId: countryMap.get("CH")!.id } }),
  ]);

  const categories = await Promise.all([
    // Footwear
    prisma.category.create({ data: { name: "Sneakers"      } }),
    prisma.category.create({ data: { name: "Boots"         } }),
    prisma.category.create({ data: { name: "Sandals"       } }),
    prisma.category.create({ data: { name: "Heels"         } }),
    prisma.category.create({ data: { name: "Loafers"       } }),
    // Tops
    prisma.category.create({ data: { name: "T-Shirts"      } }),
    prisma.category.create({ data: { name: "Hoodies"       } }),
    prisma.category.create({ data: { name: "Blouses"       } }),
    prisma.category.create({ data: { name: "Shirts"        } }),
    prisma.category.create({ data: { name: "Knitwear"      } }),
    // Bottoms
    prisma.category.create({ data: { name: "Jeans"         } }),
    prisma.category.create({ data: { name: "Trousers"      } }),
    prisma.category.create({ data: { name: "Shorts"        } }),
    prisma.category.create({ data: { name: "Skirts"        } }),
    prisma.category.create({ data: { name: "Leggings"      } }),
    // Outerwear
    prisma.category.create({ data: { name: "Jackets"       } }),
    prisma.category.create({ data: { name: "Coats"         } }),
    prisma.category.create({ data: { name: "Blazers"       } }),
    prisma.category.create({ data: { name: "Vests"         } }),
    // Dresses & Suits
    prisma.category.create({ data: { name: "Dresses"       } }),
    prisma.category.create({ data: { name: "Jumpsuits"     } }),
    prisma.category.create({ data: { name: "Suits"         } }),
    // Accessories
    prisma.category.create({ data: { name: "Bags"          } }),
    prisma.category.create({ data: { name: "Belts"         } }),
    prisma.category.create({ data: { name: "Scarves"       } }),
    prisma.category.create({ data: { name: "Hats"          } }),
    prisma.category.create({ data: { name: "Sunglasses"    } }),
    prisma.category.create({ data: { name: "Jewellery"     } }),
    prisma.category.create({ data: { name: "Watches"       } }),
    // Activewear
    prisma.category.create({ data: { name: "Sports Tops"   } }),
    prisma.category.create({ data: { name: "Sports Bottoms"} }),
    prisma.category.create({ data: { name: "Sports Shoes"  } }),
  ]);

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
    "Sneaker", "Boot", "Sandal", "Heel", "Loafer",
    "T-Shirt", "Hoodie", "Blouse", "Shirt", "Knit Sweater",
    "Jeans", "Trousers", "Shorts", "Skirt", "Leggings",
    "Jacket", "Coat", "Blazer", "Vest", "Puffer",
    "Dress", "Jumpsuit", "Suit", "Co-ord Set",
    "Tote Bag", "Crossbody", "Belt", "Scarf", "Cap",
    "Sunglasses", "Necklace", "Watch", "Earrings", "Bracelet",
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
    outfits.map((outfit) => {
      // pick a reviewer that is not the outfit creator
      const eligibleReviewers = users.filter((u) => u.id !== outfit.createdBy);
      return prisma.review.create({
        data: {
          score:     Math.floor(Math.random() * 2) + 4,
          text:      pick(reviewTexts),
          writtenBy: pick(eligibleReviewers).id,
          outfitId:  outfit.id,
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

  // Assign 1-3 random images to each item
const imageUrls = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff", // Nike shoe
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30", // watch
  "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3", // jacket
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105", // clothing
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d", // sneakers
  "https://images.unsplash.com/photo-1560343090-f0409e92791a", // shoes
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27", // hoodie
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa", // bag
];

console.log(`🌱 Seeding images for ${CONFIG.items} items...`);

const seededImages = await Promise.all(
  items.flatMap((item) => {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 images per item
    return Array.from({ length: count }, () =>
      prisma.image.create({
        data: {
          url:    `${pick(imageUrls)}?item=${item.id}`,  // query param keeps URLs unique
          itemId: item.id,
        },
      })
    );
  })
);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("✅ Stress seed complete!");
  console.table({
    countries:   countries.length,
    roles:       2,
    brands:      brands.length,
    categories:  categories.length,
    users:       users.length,
    items:       items.length,
    closets:     closets.length,
    closetItems: closetItemsCreated.length,
    outfits: users.length * CONFIG.outfitsPerUser,
    outfitItems:   users.length * CONFIG.outfitsPerUser * CONFIG.itemsPerOutfit,
    reviews:       outfits.length, //only 1 reviev per outfit
    sharedClosets: sharedClosetCount,
    images: seededImages.length
  });
}

seed()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });