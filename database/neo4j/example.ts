/**
 * neo4j/examples.ts
 *
 * Runnable usage examples for all Neogma models.
 * These are NOT production code — they demonstrate the API patterns
 * you will use in your service layer.
 *
 * Run with:  npx ts-node --esm src/database/neo4j/examples.ts
 */

import { neogma } from "./neogma-client.js";
import {
  getUserModel,
  getRoleModel,
  getCountryModel,
  getItemModel,
  getClosetModel,
  getOutfitModel,
  getReviewModel,
  getBrandModel,
  getCategoryModel,
} from "./models/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE — new node with relationships in one call
// ─────────────────────────────────────────────────────────────────────────────

async function exampleCreateUser() {
  /**
   * Analogy: think of createOne() like calling persist() in JPA, but
   * it also accepts nested related-node data (like a cascade-persist).
   *
   * The nested `role` key matches the alias defined in UserRelatedNodes.
   * If the Role node already exists you should use `relateTo` instead
   * (see exampleRelateTo below) to avoid duplicate nodes.
   */
  const UserModel = getUserModel();

  const newUser = await UserModel.createOne({
    id: 1,
    firstName: "Emma",
    lastName: "Hansen",
    email: "emma@example.com",
    // Nested creation: creates the Role node AND the (User)-[:HAS]->(Role) edge
    role: {
      name: "user",
    },
    // Nested creation with relationship property
    closets: {
      id: 100,
      name: "Spring 2025",
      description: "Light and breezy looks",
      isPublic: true,
      // This becomes the `createdAt` property on the [:HAS] relationship
      createdAt: new Date().toISOString(),
    },
  });

  console.log("Created user:", newUser.id, newUser.email);
  return newUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RELATE — connect existing nodes
// ─────────────────────────────────────────────────────────────────────────────

async function exampleRelateTo() {
  const UserModel = getUserModel();
  const CountryModel = getCountryModel();

  // Ensure country exists (MERGE pattern — create only if not present)
  const denmark = await CountryModel.createOne(
    { name: "Denmark", countryCode: "DK" },
    { merge: true } // like SQL INSERT ... ON CONFLICT DO NOTHING
  );

  const user = await UserModel.findOne({ where: { email: "emma@example.com" } });
  if (!user) throw new Error("User not found");

  // Creates (User)-[:IS_FROM]->(Country) edge
  await user.relateTo({
    alias: "country",       // must match a key in UserRelatedNodes
    where: { countryCode: "DK" },
  });

  console.log("User related to country Denmark");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FIND with eager-loaded relationships
// ─────────────────────────────────────────────────────────────────────────────

async function exampleFindWithRelationships() {
  const UserModel = getUserModel();

  /**
   * `include` is Neogma's equivalent of SQL JOINs / JPA FETCH JOIN.
   * Each alias in the array corresponds to a key in UserRelatedNodes.
   */
  const users = await UserModel.findMany({
    where: { id: 1 },
    include: [
      { alias: "role" },
      { alias: "country" },
      {
        alias: "closets",
        include: [
          { alias: "items" }, // nested include: closet → items
        ],
      },
    ],
  });

  for (const user of users) {
    // TypeScript knows `user.role` is RoleInstance[] here
    console.log(user.firstName, "→ role:", user.role?.[0]?.name);
    console.log("closets:", user.closets?.map((c) => c.name));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE — patch node properties
// ─────────────────────────────────────────────────────────────────────────────

async function exampleUpdate() {
  const UserModel = getUserModel();

  // Static update — patches all nodes matching the where clause
  await UserModel.update(
    { firstName: "Emma-Updated" },
    { where: { id: 1 } }
  );

  // Instance update — mutate then save
  const user = await UserModel.findOne({ where: { id: 1 } });
  if (!user) return;
  user.lastName = "Nielsen";
  await user.save();

  console.log("Updated:", user.firstName, user.lastName);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. UPDATE relationship properties
// ─────────────────────────────────────────────────────────────────────────────

async function exampleUpdateRelationship() {
  const UserModel = getUserModel();

  /**
   * Updates the `createdAt` property on (User)-[:HAS]->(Closet) edges.
   * Think of it as: UPDATE user_closet_join SET created_at = ? WHERE ...
   */
  await UserModel.updateRelationship(
    { createdAt: new Date().toISOString() },
    {
      alias: "closets",
      where: {
        source: { id: 1 },          // the User node
        target: { id: 100 },        // the Closet node
      },
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DELETE
// ─────────────────────────────────────────────────────────────────────────────

async function exampleDelete() {
  const ReviewModel = getReviewModel();

  // Delete all reviews with score below 2 (detach removes relationships too)
  const deletedCount = await ReviewModel.delete({
    where: { score: 1 },
    detach: true,
  });

  console.log(`Deleted ${deletedCount} low-score reviews`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TRANSACTIONS — wrap multiple writes in a single atomic operation
// ─────────────────────────────────────────────────────────────────────────────

async function exampleTransaction() {
  const UserModel = getUserModel();
  const ReviewModel = getReviewModel();
  const OutfitModel = getOutfitModel();

  /**
   * Analogy: this is exactly like @Transactional in Spring — all operations
   * inside succeed together, or the whole thing rolls back.
   *
   * Neo4j uses explicit sessions. Neogma accepts an optional `session`
   * in every operation's configuration object.
   */
  const session = neogma.driver.session();

  try {
    await session.writeTransaction(async (tx) => {
      // Pass the transaction as `session` to each model operation
      const outfit = await OutfitModel.createOne(
        { id: 200, name: "Evening Look", style: "formal" },
        { session: tx }
      );

      const review = await ReviewModel.createOne(
        {
          id: 300,
          score: 5,
          text: "Absolutely love this outfit!",
          // Nested: creates (Review)-[:ABOUT]->(Outfit)
          outfit: { id: outfit.id },
        },
        { session: tx }
      );

      // Also record that the user wrote this review
      const user = await UserModel.findOne(
        { where: { id: 1 } },
        { session: tx }
      );
      if (!user) throw new Error("User not found — tx will roll back");

      await user.relateTo({
        alias: "reviews",
        where: { id: review.id },
        // Relationship property on [:WRITES]
        properties: { dateWritten: new Date().toISOString() },
        session: tx,
      });

      console.log("Transaction committed: outfit + review + user-writes-review");
    });
  } finally {
    await session.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. FIND relationships (graph-native query)
// ─────────────────────────────────────────────────────────────────────────────

async function exampleFindRelationships() {
  const UserModel = getUserModel();

  /**
   * findRelationships returns the source node, target node, AND the
   * relationship properties — useful when you care about what's ON the edge.
   *
   * Example: "give me all (User)-[:WRITES {dateWritten}]->(Review) for user 1"
   */
  const results = await UserModel.findRelationships({
    alias: "reviews",
    where: {
      source: { id: 1 },
    },
  });

  for (const { source, target, relationship } of results) {
    console.log(
      `${source.firstName} wrote review ${target.id} on ${relationship.dateWritten}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all examples sequentially
// ─────────────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await neogma.verifyConnectivity();
    await exampleCreateUser();
    await exampleRelateTo();
    await exampleFindWithRelationships();
    await exampleUpdate();
    await exampleUpdateRelationship();
    await exampleDelete();
    await exampleTransaction();
    await exampleFindRelationships();
  } catch (err) {
    console.error("Example failed:", err);
  } finally {
    await neogma.driver.close();
  }
})();