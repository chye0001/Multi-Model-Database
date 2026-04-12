import "dotenv/config";

import { PostgresBrandRepository } from '../postgres/PostgresBrandRepository.js';
import { MongoBrandRepository } from '../mongo/MongoBrandRepository.js';
import { Neo4jBrandRepository } from '../neo4j/Neo4jBrandRepository.js';
import { CompositeBrandRepository } from '../composite_repositories/CompositeBrandRepository.js';
import type { IBrandRepository } from '../interfaces/IBrandRepository.js';

export function brandRepositoryFactory() {
  const repos: IBrandRepository[] = [];

  const env = process.env.NODE_ENV ?? "dev";
  const allowedEnvs = ["dev", "test", "prod"];
  if (!allowedEnvs.includes(env)) {
    throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
  }

  if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new PostgresBrandRepository());
  if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new MongoBrandRepository());
  if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new Neo4jBrandRepository());

  return new CompositeBrandRepository(repos);
}
