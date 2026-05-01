import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { Neo4jContainer, StartedNeo4jContainer } from "@testcontainers/neo4j";

export interface TestContainers {
  postgres: StartedPostgreSqlContainer;
  mongo:    StartedMongoDBContainer;
  neo4j:    StartedNeo4jContainer;
}

let containers: TestContainers | null = null;

export async function startContainers(): Promise<TestContainers> {
  if (containers) return containers;

  console.log("🐳 Starting test containers...");

  // Start all three in parallel
  const [postgres, mongo, neo4j] = await Promise.all([
    new PostgreSqlContainer("postgres:17")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_pass")
      .start(),

    new MongoDBContainer("mongo:7")
      .start(),

    new Neo4jContainer("neo4j:5")
      .withPassword("test_pass")
      .start(),
  ]);

  console.log("✅ All containers started");

  containers = { postgres, mongo, neo4j };
  return containers;
}

export async function stopContainers(): Promise<void> {
  if (!containers) return;
  
  // Gives the connections 12s to drain before pulling the container
  await new Promise((res) => setTimeout(res, 12000));

  console.log("🐳 Stopping test containers...");
  await Promise.all([
    containers.postgres.stop(),
    containers.mongo.stop(),
    containers.neo4j.stop(),
  ]);
  containers = null;
  console.log("✅ All containers stopped");
}