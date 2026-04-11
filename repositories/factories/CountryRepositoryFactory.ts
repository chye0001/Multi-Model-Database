import "dotenv/config";

import { PostgresCountryRepository } from '../postgres/PostgresCountryRepository.js';
import { MongoCountryRepository } from '../mongo/MongoCountryRepository.js';
import { Neo4jCountryRepository } from '../neo4j/Neo4jCountryRepository.js';
import { CompositeCountryRepository } from '../composite_repositories/CompositeCountryRepository.js';
import type { ICountryRepository } from '../interfaces/ICountryRepository.js';

export function countryRepositoryFactory() {
  const repos: ICountryRepository[] = [];

  const env = process.env.NODE_ENV ?? "dev";
  const allowedEnvs = ["dev", "test", "prod"];
  if (!allowedEnvs.includes(env)) {
    throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
  }

  if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new PostgresCountryRepository());
  if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new MongoCountryRepository());
  if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new Neo4jCountryRepository());

  return new CompositeCountryRepository(repos);
}
