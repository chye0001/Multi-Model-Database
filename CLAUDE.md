# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                    # Start dev server with hot-reload (tsx watch)
npm run build                  # Compile TypeScript

# Database setup (run once per environment)
docker compose -f docker-compose.db.yml up -d   # Start all three databases

# Prisma (PostgreSQL)
npm run prisma:migrate         # Create and apply migrations
npm run prisma:generate        # Regenerate Prisma client after schema changes
npm run prisma:seed            # Seed Postgres with test data
npm run prisma:reset           # Drop and re-migrate Postgres

# MongoDB
npm run mongo:seed             # Seed MongoDB
npm run mongo:reset            # Drop and re-seed MongoDB

# Neo4j
npm run neo4j:seed             # Seed Neo4j
npm run neo4j:reset            # Reset Neo4j

# All databases
npm run all-databases:reset    # Reset all three databases
npm run all-databases:migrate  # ETL: migrate data from Postgres → MongoDB + Neo4j
```

No test runner is currently configured (`npm run test` is a no-op).

## Architecture

This is a Node.js/TypeScript Express API that demonstrates the same domain (fashion/clothing management) across three database paradigms simultaneously: relational (PostgreSQL via Prisma), document (MongoDB via Mongoose), and graph (Neo4j via Neogma).

### Data flow

```
HTTP Request → Router → Controller → Service → CompositeRepository
                                                    ├── PostgresRepository
                                                    ├── MongoRepository
                                                    └── Neo4jRepository
```

### Key patterns

**Repository + Composite pattern**: Each entity has one repository interface (`repositories/interfaces/IUserRepository.ts`) and database-specific implementations. `CompositeUserRepository` queries all enabled databases in parallel via `Promise.all()` and merges results.

**Factory pattern**: `UserRepositoryFactory` reads environment variables (`POSTGRES_ENABLED_DEV`, `MONGO_ENABLED_DEV`, `NEO4J_ENABLED_DEV`, etc.) to instantiate only the active repositories, then wraps them in a composite.

**Environment toggling**: Individual databases can be enabled/disabled per environment via env vars. This allows testing with a single database or all three simultaneously.

**Shared DTOs**: All repository implementations map to common DTOs in `/dtos/`, ensuring the service layer receives consistent data regardless of which database provided it.

### Database roles

- **PostgreSQL** — single source of truth (normalized relational schema, managed via Prisma migrations)
- **MongoDB** — denormalized document store (embeds related data, e.g. role embedded in user document)
- **Neo4j** — graph store for relationship queries (social connections, shared closets); uses Neogma's ModelFactory pattern and Cypher queries

### Migration

`database/migrate.ts` is the ETL script that reads all data from Postgres and writes it to MongoDB and Neo4j. Run this after seeding Postgres when setting up the other databases for the first time or after schema changes.

### Adding a new entity

When adding a new entity, follow this checklist:
1. Add to Prisma schema and run `prisma:migrate` + `prisma:generate`
2. Create Mongoose model under `database/mongo/models/`
3. Create Neogma model under `database/neo4j/models/`
4. Create repository interface in `repositories/interfaces/`
5. Implement Postgres, Mongo, and Neo4j repositories
6. Create a composite repository and factory
7. Wire up in a service, controller, and router
8. Update `database/migrate.ts` to include the new entity in the ETL
