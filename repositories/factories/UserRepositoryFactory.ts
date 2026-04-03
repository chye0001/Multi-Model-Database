import "dotenv/config";

import { PostgresUserRepository } from '../postgres/PostgresUserRepository.js';
import { MongoUserRepository } from '../mongo/MongoUserRepository.js';
import { Neo4jUserRepository } from '../neo4j/Neo4jUserRepository.js';
import { CompositeUserRepository } from '../composite_repositories/CompositeUserRepository.js';

import type { IUserRepository } from '../interfaces/IUserRepository.js';

export function userRepositoryFactory() {
  const repos: IUserRepository[] = [];

  const env = process.env.NODE_ENV ?? "dev";
  const allowedEnvs = ["dev", "test", "prod"];
  if (!allowedEnvs.includes(env)) {
    throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
  }

  if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new PostgresUserRepository());
  if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new MongoUserRepository());
  if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new Neo4jUserRepository());

  return new CompositeUserRepository(repos);
}
