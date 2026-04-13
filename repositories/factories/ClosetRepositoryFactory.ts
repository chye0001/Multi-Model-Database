import { PostgresClosetRepository } from "../postgres/PostgresClosetRepository.js";
import { MongoClosetRepository } from "../mongo/MongoClosetRepository.js";
import { Neo4jClosetRepository } from "../neo4j/Neo4jClosetRepository.js";
import { CompositeClosetRepository } from "../composite_repositories/CompositeClosetRepository.js";

import type { IClosetRepository } from "../interfaces/IClosetRepository.js";

export function closetRepositoryFactory(): IClosetRepository {
    const repositories: IClosetRepository[] = [];

    if (process.env.POSTGRES_ENABLED_DEV === "true") {
        repositories.push(new PostgresClosetRepository());
    }
    if (process.env.MONGO_ENABLED_DEV === "true") {
        repositories.push(new MongoClosetRepository());
    }
    if (process.env.NEO4J_ENABLED_DEV === "true") {
        repositories.push(new Neo4jClosetRepository());
    }

    return new CompositeClosetRepository(repositories);
}
