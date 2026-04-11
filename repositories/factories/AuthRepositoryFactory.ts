import "dotenv/config";

import { PostgresAuthRepository } from '../postgres/PostgresAuthRepository.js';
import { MongoAuthRepository } from '../mongo/MongoAuthRepository.js';
import { Neo4jAuthRepository } from '../neo4j/Neo4jAuthRepository.js';
import { CompositeAuthRepository } from '../composite_repositories/CompositeAuthRepository.js';

import type { IAuthRepository } from '../interfaces/IAuthRepository.js';

export function authRepositoryFactory() {
  const repos: IAuthRepository[] = [];

  const env = process.env.NODE_ENV ?? "dev";
  const allowedEnvs = ["dev", "test", "prod"];
  if (!allowedEnvs.includes(env)) {
    throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
  }

  if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new PostgresAuthRepository());
  if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new MongoAuthRepository());
  if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new Neo4jAuthRepository());

  return new CompositeAuthRepository(repos);
}
