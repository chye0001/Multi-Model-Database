import "dotenv/config";

import { PostgresCategoryRepository } from '../postgres/PostgresCategoryRepository.js';
import { MongoCategoryRepository } from '../mongo/MongoCategoryRepository.js';
import { Neo4jCategoryRepository } from '../neo4j/Neo4jCategoryRepository.js';
import { CompositeCategoryRepository } from '../composite_repositories/CompositeCategoryRepository.js';
import type { ICategoryRepository } from '../interfaces/ICategoryRepository.js';

export function categoryRepositoryFactory() {
  const repos: ICategoryRepository[] = [];

  const env = process.env.NODE_ENV ?? "dev";
  const allowedEnvs = ["dev", "test", "prod"];
  if (!allowedEnvs.includes(env)) {
    throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
  }

  if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new PostgresCategoryRepository());
  if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new MongoCategoryRepository());
  if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new Neo4jCategoryRepository());

  return new CompositeCategoryRepository(repos);
}
