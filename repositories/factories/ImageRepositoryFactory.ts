import "dotenv/config";

import type { IImageRepository } from "../interfaces/IImageRepository.js";
import { CompositeImageRepository } from "../composite_repositories/CompositeImageRepository.js";
import { PostgresImageRepository } from "../postgres/PostgresImageRepository.js";
import { MongoImageRepository } from "../mongo/MongoImageRepository.js";
import { Neo4jImageRepository } from "../neo4j/Neo4jImageRepository.js";

export function imageRepositoryFactory() {
    const repos: IImageRepository[] = [];

    const env = process.env.NODE_ENV ?? "dev";
    const allowedEnvs = ["dev", "test", "prod"];
    if (!allowedEnvs.includes(env)) {
        throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
    }

    if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === "true") repos.push(new PostgresImageRepository());
    if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === "true") repos.push(new MongoImageRepository());
    if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === "true") repos.push(new Neo4jImageRepository());

    return new CompositeImageRepository(repos);
}
