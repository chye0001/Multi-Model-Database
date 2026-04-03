// ── Uniqueness constraints ─────────────────────────────────────────────────

// Role
CREATE CONSTRAINT role_name_unique IF NOT EXISTS
  FOR (r:Role) REQUIRE r.name IS UNIQUE;

// Country
CREATE CONSTRAINT country_name_unique IF NOT EXISTS
  FOR (c:Country) REQUIRE c.name IS UNIQUE;

CREATE CONSTRAINT country_code_unique IF NOT EXISTS
  FOR (c:Country) REQUIRE c.countryCode IS UNIQUE;

// Brand
CREATE CONSTRAINT brand_name_unique IF NOT EXISTS
  FOR (b:Brand) REQUIRE b.name IS UNIQUE;

// Category
CREATE CONSTRAINT category_name_unique IF NOT EXISTS
  FOR (cat:Category) REQUIRE cat.name IS UNIQUE;

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

// Outfit
CREATE CONSTRAINT outfit_id_unique IF NOT EXISTS
  FOR (o:Outfit) REQUIRE o.id IS UNIQUE;

// Review
CREATE CONSTRAINT review_id_unique IF NOT EXISTS
  FOR (rv:Review) REQUIRE rv.id IS UNIQUE;

// ── Lookup indexes ─────────────────────────────────────────────────────────

// Find items by price range
CREATE INDEX item_price_index IF NOT EXISTS
  FOR (i:Item) ON (i.price);

// Filter outfits by style
CREATE INDEX outfit_style_index IF NOT EXISTS
  FOR (o:Outfit) ON (o.style);

// Filter closets by visibility
CREATE INDEX closet_ispublic_index IF NOT EXISTS
  FOR (cl:Closet) ON (cl.isPublic);