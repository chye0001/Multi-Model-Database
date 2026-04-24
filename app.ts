import express from "express";
import session from "express-session";

import { startNeo4jClosetCleanupScheduler, stopNeo4jClosetCleanupScheduler } from "./database/neo4j/scripts/closet-cleanup-scheduler.js";

import { connectMongo, disconnectMongo } from "./database/mongo/mongoose-client.js";
import { connectNeo4j, disconnectNeo4j } from "./database/neo4j/neogma-client.js";

const app = express();
app.use(express.json());
app.use(
    session({
      secret: process.env.SESSION_SECRET ?? "dev-secret",
      resave: false,
      saveUninitialized: false,
    })
);

import userRouter from "./routes/users.router.js";
import authRouter from "./routes/auth.router.js";
import rolesRouter from "./routes/roles.router.js";
import countriesRouter from "./routes/countries.router.js";
import categoriesRouter from "./routes/categories.router.js";
import brandsRouter from "./routes/brands.router.js";
import outfitRouter from "./routes/outfit.router.js";
import closetsRouter from "./routes/closets.router.js";
import reviewsRouter from "./routes/reviews.router.js";
import imagesRouter from "./routes/images.router.js";
import itemsRouter from "./routes/items.router.js";

app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/roles", rolesRouter);
app.use("/countries", countriesRouter);
app.use("/categories", categoriesRouter);
app.use("/brands", brandsRouter);
app.use("/outfits", outfitRouter);
app.use("/closets", closetsRouter);
app.use("/reviews", reviewsRouter);
app.use("/images", imagesRouter);
app.use("/items", itemsRouter);

app.get("/healthcheck", (_req, res) => {
  res.status(200).send("OK");
});

const port = 3001;

function isEnabled(value: string | undefined): boolean {
  return value?.toLowerCase() === "true";
}

async function startApp() {
  const env = (process.env.NODE_ENV ?? "dev").toLowerCase();
  const envKey = env.toUpperCase();

  const isMongoEnabled = isEnabled(process.env[`MONGO_ENABLED_${envKey}`]);
  const isNeo4jEnabled = isEnabled(process.env[`NEO4J_ENABLED_${envKey}`]);

  try {
    if (isMongoEnabled) {
      await connectMongo();
    }

    if (isNeo4jEnabled) {
      await connectNeo4j();
      startNeo4jClosetCleanupScheduler();
    }

    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
      console.log(`Environment: ${env}`);
      console.log(`MongoDB enabled: ${isMongoEnabled}`);
      console.log(`Neo4j enabled: ${isNeo4jEnabled}`);

      // prisma client doesn't require explicit connect/disconnect, but we do need to manage connections for MongoDB and Neo4j
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  stopNeo4jClosetCleanupScheduler();
  await disconnectMongo();
  await disconnectNeo4j();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  stopNeo4jClosetCleanupScheduler();
  await disconnectMongo();
  await disconnectNeo4j();
  process.exit(0);
});

startApp();
