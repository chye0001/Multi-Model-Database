import "dotenv/config";
import { prisma } from "../prisma-client.js";

async function seed() {

  // ── 1. COUNTRIES ───────────────────────────────────────────────────────────
  const usa = await prisma.country.create({
    data: { name: "United States", countryCode: "US" },
  });

  const denmark = await prisma.country.create({
    data: { name: "Denmark", countryCode: "DK" },
  });

  const germany = await prisma.country.create({
    data: { name: "Germany", countryCode: "DE" },
  });

  const france = await prisma.country.create({
    data: { name: "France", countryCode: "FR" },
  });

  const sweden = await prisma.country.create({
    data: { name: "Sweden", countryCode: "SE" },
  });

  // ── 2. ROLES ───────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.create({ data: { role: "Admin" } });
  const userRole  = await prisma.role.create({ data: { role: "User" } });

  // ── 3. USERS ───────────────────────────────────────────────────────────────
  const bob = await prisma.user.create({
    data: {
      email:     "bob@example.com",
      firstName: "Bob",
      lastName:  "Smith",
      roleId:    userRole.id,
      countryId: usa.id,
    },
  });

  const alice = await prisma.user.create({
    data: {
      email:     "alice@example.com",
      firstName: "Alice",
      lastName:  "Johnson",
      roleId:    adminRole.id,
      countryId: denmark.id,
    },
  });

  const sofia = await prisma.user.create({
    data: {
      email:     "sofia.berg@example.com",
      firstName: "Sofia",
      lastName:  "Berg",
      roleId:    userRole.id,
      countryId: sweden.id,
    },
  });

  const noah = await prisma.user.create({
    data: {
      email:     "noah.lindqvist@example.com",
      firstName: "Noah",
      lastName:  "Lindqvist",
      roleId:    userRole.id,
      countryId: sweden.id,
    },
  });

  // ── 4. BRANDS ──────────────────────────────────────────────────────────────
  const nike = await prisma.brand.create({
    data: { name: "Nike", countryId: usa.id },
  });

  const adidas = await prisma.brand.create({
    data: { name: "Adidas", countryId: germany.id },
  });

  const ganni = await prisma.brand.create({
    data: { name: "Ganni", countryId: denmark.id },
  });

  const apc = await prisma.brand.create({
    data: { name: "A.P.C.", countryId: france.id },
  });

  const acneStudios = await prisma.brand.create({
    data: { name: "Acne Studios", countryId: sweden.id },
  });

  // ── 5. CATEGORIES ──────────────────────────────────────────────────────────
  const shoes       = await prisma.category.create({ data: { name: "Shoes" } });
  const clothing    = await prisma.category.create({ data: { name: "Clothing" } });
  const accessories = await prisma.category.create({ data: { name: "Accessories" } });
  const outerwear   = await prisma.category.create({ data: { name: "Outerwear" } });
  const activewear  = await prisma.category.create({ data: { name: "Activewear" } });

  // ── 6. ITEMS ───────────────────────────────────────────────────────────────
  const airJordan = await prisma.item.create({
    data: { name: "Air Jordan 1", price: 170.00, categoryId: shoes.id },
  });

  const ultraBoost = await prisma.item.create({
    data: { name: "Ultra Boost", price: 180.00, categoryId: shoes.id },
  });

  const hoodie = await prisma.item.create({
    data: { name: "Classic Hoodie", price: 65.00, categoryId: clothing.id },
  });

  const watch = await prisma.item.create({
    data: { name: "Minimalist Watch", price: 250.00, categoryId: accessories.id },
  });

  const woolOvercoat = await prisma.item.create({
    data: { name: "Wool Overcoat", price: 420.00, categoryId: outerwear.id },
  });

  const summerDress = await prisma.item.create({
    data: { name: "Floral Summer Dress", price: 135.00, categoryId: clothing.id },
  });

  const runningShorts = await prisma.item.create({
    data: { name: "Running Shorts", price: 45.00, categoryId: activewear.id },
  });

  const silkBlouse = await prisma.item.create({
    data: { name: "Silk Blouse", price: 175.00, categoryId: clothing.id },
  });

  // ── 7. ITEM BRANDS (supports collabs — multiple brands per item) ───────────
  // Air Jordan → Nike
  await prisma.itemBrand.create({ data: { itemId: airJordan.id, brandId: nike.id } });

  // Ultra Boost → Adidas
  await prisma.itemBrand.create({ data: { itemId: ultraBoost.id, brandId: adidas.id } });

  // Classic Hoodie → Nike x Adidas collab
  await prisma.itemBrand.create({ data: { itemId: hoodie.id, brandId: nike.id } });
  await prisma.itemBrand.create({ data: { itemId: hoodie.id, brandId: adidas.id } });

  // Watch → Ganni
  await prisma.itemBrand.create({ data: { itemId: watch.id, brandId: ganni.id } });

  // Wool Overcoat → Acne Studios
  await prisma.itemBrand.create({ data: { itemId: woolOvercoat.id, brandId: acneStudios.id } });

  // Summer Dress → Ganni
  await prisma.itemBrand.create({ data: { itemId: summerDress.id, brandId: ganni.id } });

  // Silk Blouse → A.P.C. x Ganni collab
  await prisma.itemBrand.create({ data: { itemId: silkBlouse.id, brandId: apc.id } });
  await prisma.itemBrand.create({ data: { itemId: silkBlouse.id, brandId: ganni.id } });

  // Running Shorts → Nike
  await prisma.itemBrand.create({ data: { itemId: runningShorts.id, brandId: nike.id } });

  // ── 8. IMAGES ──────────────────────────────────────────────────────────────
  await prisma.image.create({ data: { url: "https://example.com/airjordan1.jpg",  itemId: airJordan.id } });
  await prisma.image.create({ data: { url: "https://example.com/ultraboost.jpg",  itemId: ultraBoost.id } });
  await prisma.image.create({ data: { url: "https://example.com/hoodie.jpg",      itemId: hoodie.id } });
  await prisma.image.create({ data: { url: "https://example.com/watch.jpg",       itemId: watch.id } });
  await prisma.image.create({ data: { url: "https://example.com/overcoat.jpg",    itemId: woolOvercoat.id } });
  await prisma.image.create({ data: { url: "https://example.com/dress.jpg",       itemId: summerDress.id } });

  // ── 9. CLOSETS ─────────────────────────────────────────────────────────────
  const bobCloset = await prisma.closet.create({
    data: {
      name:        "Bob's Wardrobe",
      description: "My everyday collection",
      isPublic:    true,
      userId:      bob.id,
    },
  });

  const aliceCloset = await prisma.closet.create({
    data: {
      name:        "Alice's Premium Collection",
      description: "High-end fashion pieces",
      isPublic:    false,
      userId:      alice.id,
    },
  });

  const sofiaCloset = await prisma.closet.create({
    data: {
      name:        "Sofia's Summer Picks",
      description: "Light and breezy looks",
      isPublic:    true,
      userId:      sofia.id,
    },
  });

  const noahCloset = await prisma.closet.create({
    data: {
      name:        "Noah's Streetwear",
      description: "Urban street style",
      isPublic:    true,
      userId:      noah.id,
    },
  });

  // ── 10. CLOSET ITEMS ───────────────────────────────────────────────────────
  const bobAirJordan  = await prisma.closetItem.create({ data: { itemId: airJordan.id,    closetId: bobCloset.id } });
  const bobHoodie     = await prisma.closetItem.create({ data: { itemId: hoodie.id,       closetId: bobCloset.id } });
  const bobShorts     = await prisma.closetItem.create({ data: { itemId: runningShorts.id, closetId: bobCloset.id } });

  const aliceUltraBoost = await prisma.closetItem.create({ data: { itemId: ultraBoost.id, closetId: aliceCloset.id } });
  const aliceWatch      = await prisma.closetItem.create({ data: { itemId: watch.id,      closetId: aliceCloset.id } });
  const aliceBlouse     = await prisma.closetItem.create({ data: { itemId: silkBlouse.id, closetId: aliceCloset.id } });

  const sofiaDress    = await prisma.closetItem.create({ data: { itemId: summerDress.id,  closetId: sofiaCloset.id } });
  const sofiaOvercoat = await prisma.closetItem.create({ data: { itemId: woolOvercoat.id, closetId: sofiaCloset.id } });

  const noahHoodie    = await prisma.closetItem.create({ data: { itemId: hoodie.id,       closetId: noahCloset.id } });
  const noahJordan    = await prisma.closetItem.create({ data: { itemId: airJordan.id,    closetId: noahCloset.id } });

  // ── 11. OUTFITS ────────────────────────────────────────────────────────────
  const casualOutfit = await prisma.outfit.create({
    data: { name: "Casual Friday",    style: "Streetwear", createdBy: bob.id },
  });

  const premiumOutfit = await prisma.outfit.create({
    data: { name: "Evening Elegance", style: "Formal",     createdBy: alice.id },
  });

  const summerOutfit = await prisma.outfit.create({
    data: { name: "Summer Festival",  style: "Bohemian",   createdBy: sofia.id },
  });

  const streetOutfit = await prisma.outfit.create({
    data: { name: "Street Ready",     style: "Streetwear", createdBy: noah.id },
  });

  // ── 12. OUTFIT ITEMS (links closet items to outfits) ───────────────────────
  await prisma.outfitItem.create({ data: { outfitId: casualOutfit.id,  closetItemId: bobAirJordan.id } });
  await prisma.outfitItem.create({ data: { outfitId: casualOutfit.id,  closetItemId: bobHoodie.id } });
  await prisma.outfitItem.create({ data: { outfitId: casualOutfit.id,  closetItemId: bobShorts.id } });

  await prisma.outfitItem.create({ data: { outfitId: premiumOutfit.id, closetItemId: aliceUltraBoost.id } });
  await prisma.outfitItem.create({ data: { outfitId: premiumOutfit.id, closetItemId: aliceWatch.id } });
  await prisma.outfitItem.create({ data: { outfitId: premiumOutfit.id, closetItemId: aliceBlouse.id } });

  await prisma.outfitItem.create({ data: { outfitId: summerOutfit.id,  closetItemId: sofiaDress.id } });
  await prisma.outfitItem.create({ data: { outfitId: summerOutfit.id,  closetItemId: sofiaOvercoat.id } });

  await prisma.outfitItem.create({ data: { outfitId: streetOutfit.id,  closetItemId: noahHoodie.id } });
  await prisma.outfitItem.create({ data: { outfitId: streetOutfit.id,  closetItemId: noahJordan.id } });

  // ── 13. REVIEWS ────────────────────────────────────────────────────────────
  // outfitId is required in the schema — was missing in the original seed
  const bobReview = await prisma.review.create({
    data: {
      score:     5,
      text:      "Amazing shoes! Super comfortable and stylish.",
      writtenBy: bob.id,
      outfitId:  casualOutfit.id,
    },
  });

  const aliceReview = await prisma.review.create({
    data: {
      score:     4,
      text:      "Great quality, a bit pricey but worth it.",
      writtenBy: alice.id,
      outfitId:  premiumOutfit.id,
    },
  });

  const sofiaReview = await prisma.review.create({
    data: {
      score:     5,
      text:      "The color palette is chef's kiss.",
      writtenBy: sofia.id,
      outfitId:  summerOutfit.id,
    },
  });

  const noahReview = await prisma.review.create({
    data: {
      score:     4,
      text:      "Bold choices but it really works!",
      writtenBy: noah.id,
      outfitId:  streetOutfit.id,
    },
  });

  // ── 14. SHARED CLOSETS ─────────────────────────────────────────────────────
  // Bob shares his wardrobe with Alice — mirrors original seed
  const bobSharedWithAlice = await prisma.sharedCloset.create({
    data: { closetId: bobCloset.id, userId: alice.id },
  });

  // Sofia shares her closet with Noah
  const sofiaSharedWithNoah = await prisma.sharedCloset.create({
    data: { closetId: sofiaCloset.id, userId: noah.id },
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log({
    countries:    { usa, denmark, germany, france, sweden },
    roles:        { adminRole, userRole },
    users:        { bob, alice, sofia, noah },
    brands:       { nike, adidas, ganni, apc, acneStudios },
    categories:   { shoes, clothing, accessories, outerwear, activewear },
    items:        { airJordan, ultraBoost, hoodie, watch, woolOvercoat, summerDress, runningShorts, silkBlouse },
    closets:      { bobCloset, aliceCloset, sofiaCloset, noahCloset },
    outfits:      { casualOutfit, premiumOutfit, summerOutfit, streetOutfit },
    reviews:      { bobReview, aliceReview, sofiaReview, noahReview },
    sharedClosets:{ bobSharedWithAlice, sofiaSharedWithNoah },
  });
  console.log("✅ Database seeded successfully!");
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });