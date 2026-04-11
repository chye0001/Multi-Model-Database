export function isRepositoriesEnabled(enabledRepos: unknown[]): void {
    if (enabledRepos.length === 0) {
        throw new Error("No repositories enabled");
    }
}

export function throwIfNotSupportedDatabase(databaseName: string) {
    if (databaseName !== "mongodb" && databaseName !== "postgresql" && databaseName !== "neo4j") {
        throw new Error(`Unsupported database name: ${databaseName}. Expected "MongoDB", "PostgreSQL", or "Neo4j".`);
    }
}