// ── Uniqueness constraints ─────────────────────────────────────────────────

// Role
CREATE CONSTRAINT role_id_unique IF NOT EXISTS
  FOR (r:Role) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT role_name_unique IF NOT EXISTS
  FOR (r:Role) REQUIRE r.name IS UNIQUE;

// Country
CREATE CONSTRAINT country_id_unique IF NOT EXISTS
  FOR (c:Country) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT country_name_unique IF NOT EXISTS
  FOR (c:Country) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT country_code_unique IF NOT EXISTS
  FOR (c:Country) REQUIRE c.countryCode IS UNIQUE;

// Brand
CREATE CONSTRAINT brand_id_unique IF NOT EXISTS
  FOR (b:Brand) REQUIRE b.id IS UNIQUE;
CREATE CONSTRAINT brand_name_unique IF NOT EXISTS
  FOR (b:Brand) REQUIRE b.name IS UNIQUE;

// Category
CREATE CONSTRAINT category_id_unique IF NOT EXISTS
  FOR (cat:Category) REQUIRE cat.id IS UNIQUE;
CREATE CONSTRAINT category_name_unique IF NOT EXISTS
  FOR (cat:Category) REQUIRE cat.name IS UNIQUE;

// Image
CREATE CONSTRAINT image_id_unique IF NOT EXISTS
  FOR (img:Image) REQUIRE img.id IS UNIQUE;

// User
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
  FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT user_email_unique IF NOT EXISTS
  FOR (u:User) REQUIRE u.email IS UNIQUE;

// Item
CREATE CONSTRAINT item_id_unique IF NOT EXISTS
  FOR (i:Item) REQUIRE i.id IS UNIQUE;

// Closet
CREATE CONSTRAINT closet_id_unique IF NOT EXISTS
  FOR (cl:Closet) REQUIRE cl.id IS UNIQUE;

// Shared Closet
CREATE CONSTRAINT shared_closet_unique IF NOT EXISTS
  FOR ()-[r:CO_CURATES]-()
  REQUIRE (r.userId, r.closetId) IS UNIQUE;

// Outfit
CREATE CONSTRAINT outfit_id_unique IF NOT EXISTS
  FOR (o:Outfit) REQUIRE o.id IS UNIQUE;

// Review
CREATE CONSTRAINT review_id_unique IF NOT EXISTS
  FOR (rv:Review) REQUIRE rv.id IS UNIQUE;

// ── Lookup indexes ─────────────────────────────────────────────────────────

// Users are looked up by email (login / search)
CREATE INDEX user_email_index IF NOT EXISTS
  FOR (u:User) ON (u.email);

// Items are browsed by price range and filtered by name
CREATE INDEX item_price_index IF NOT EXISTS
  FOR (i:Item) ON (i.price);
CREATE INDEX item_name_index IF NOT EXISTS
  FOR (i:Item) ON (i.name);

// Outfits are filtered by style (e.g. "casual", "formal")
CREATE INDEX outfit_style_index IF NOT EXISTS
  FOR (o:Outfit) ON (o.style);

// Closets are filtered by visibility when browsing public closets
CREATE INDEX closet_ispublic_index IF NOT EXISTS
  FOR (cl:Closet) ON (cl.isPublic);

// Reviews are sorted/filtered by score
CREATE INDEX review_score_index IF NOT EXISTS
  FOR (rv:Review) ON (rv.score);