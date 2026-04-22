import "dotenv/config";

import { PostgresItemRepository } from '../postgres/PostgresItemRepository.js';
import { MongoItemRepository } from '../mongo/MongoItemRepository.js';
import { Neo4jItemRepository } from '../neo4j/Neo4jItemRepository.js';
import { CompositeItemRepository } from '../composite_repositories/CompositeItemRepository.js';
import type { IItemRepository } from '../interfaces/IItemRepository.js';

export function itemRepositoryFactory() {
  const repos: IItemRepository[] = [];

  const env = process.env.NODE_ENV ?? "dev";
  const allowedEnvs = ["dev", "test", "prod"];
  if (!allowedEnvs.includes(env)) {
    throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
  }

  if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new PostgresItemRepository());
  if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new MongoItemRepository());
  if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new Neo4jItemRepository());

  return new CompositeItemRepository(repos);
}