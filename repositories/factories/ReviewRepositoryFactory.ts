import "dotenv/config";

import type { IReviewRepository } from "../interfaces/IReviewRepository.js";
import { CompositeReviewRepository } from "../composite_repositories/CompositeReviewRepository.js";
import { PostgresReviewRepository } from "../postgres/PostgresReviewRepository.js";
import { MongoReviewRepository } from "../mongo/MongoReviewRepository.js";
import { Neo4jReviewRepository } from "../neo4j/Neo4jReviewRepository.js";

export function reviewRepositoryFactory() {
    const repos: IReviewRepository[] = [];

    const env = process.env.NODE_ENV ?? "dev";
    const allowedEnvs = ["dev", "test", "prod"];
    if (!allowedEnvs.includes(env)) {
        throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
    }

    if (process.env[`POSTGRES_ENABLED_${env.toUpperCase()}`] === "true") repos.push(new PostgresReviewRepository());
    if (process.env[`MONGO_ENABLED_${env.toUpperCase()}`] === "true") repos.push(new MongoReviewRepository());
    if (process.env[`NEO4J_ENABLED_${env.toUpperCase()}`] === "true") repos.push(new Neo4jReviewRepository());

    return new CompositeReviewRepository(repos);
}
