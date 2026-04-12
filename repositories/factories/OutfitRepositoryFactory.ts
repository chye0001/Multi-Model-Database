import "dotenv/config";

import type {IOutfitRepository} from "../interfaces/IOutfitRepository.js";
import {CompositeOutfitRepository} from "../composite_repositories/CompositeOutfitRepository.js";
import {PostgresOutfitRepository} from '../postgres/PostgresOutfitRepository.js';
import {MongoOutfitRepository} from "../mongo/MongoOutfitRepository.js";
import {Neo4jOutfitRepository} from "../neo4j/Neo4jOutfitRepository.js";

export function outfitRepositoryFactory() {
    const repos: IOutfitRepository[] = [];

    const env = process.env.NODE_ENV ?? "dev";
    const allowedEnvs = ["dev", "test", "prod"];
    if (!allowedEnvs.includes(env)) {
        throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
    }

    if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new PostgresOutfitRepository());
    if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new MongoOutfitRepository());
    if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === 'true') repos.push(new Neo4jOutfitRepository());

    return new CompositeOutfitRepository(repos);
}
