import express from "express";
import session from "express-session";

import { prisma } from "./database/postgres/prisma-client.js";

import { connectMongo, disconnectMongo } from "./database/mongo/mongoose-client.js";
import { connectNeo4j, disconnectNeo4j } from "./database/neo4j/neogma-client.js";

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET ?? "dev-secret",
  resave: false,
  saveUninitialized: false,
}));

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


const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
  // prisma client doesn't require explicit connect/disconnect, but we do need to manage connections for MongoDB and Neo4j
  connectMongo();
  connectNeo4j();
});

app.get("/healthcheck", (req, res) => {
  res.status(200).send("OK");
});

process.on("SIGINT", async () => {
  await disconnectMongo();
  await disconnectNeo4j();
  process.exit(0);
});

