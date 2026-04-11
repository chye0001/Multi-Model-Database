import "dotenv/config";

import { PostgresRolesRepository } from '../postgres/PostgresRolesRepository.js';
import { MongoRolesRepository } from '../mongo/MongoRolesRepository.js';
import { Neo4jRolesRepository } from '../neo4j/Neo4jRolesRepository.js';
import { CompositeRolesRepository } from '../composite_repositories/CompositeRolesRepository.js';
import type { IRolesRepository } from '../interfaces/IRolesRepository.js';

export function rolesRepositoryFactory() {
  const repos: IRolesRepository[] = [];

  const env = process.env.NODE_ENV ?? "dev";
  const allowedEnvs = ["dev", "test", "prod"];
  if (!allowedEnvs.includes(env)) {
    throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
  }

  if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new PostgresRolesRepository());
  if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new MongoRolesRepository());
  if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new Neo4jRolesRepository());

  return new CompositeRolesRepository(repos);
}
