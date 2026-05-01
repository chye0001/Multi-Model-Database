# Test Configuration

The database integration tests have been implemented using the [Vitest](https://vitest.dev/) testing library combined with [Testcontainers](https://node.testcontainers.org/) to spin up real, isolated Docker containers for each test run — meaning no shared state with your development databases.

---

## Prerequisites

Before running the tests, make sure the following are available on your machine:

- **Node.js** v20 or higher
- **Docker** running in the background (Testcontainers requires it)
- Dependencies installed: `npm install`

---

## How it works

Each test suite spins up its own throwaway Docker containers for PostgreSQL, MongoDB, and Neo4j. The containers are started and seeded in `beforeAll`, used during the tests, and stopped in `afterAll`. No data ever touches the development databases.

---

## Running the tests

### Run all integration tests
```bash
npm run test:integration
```

### Run individual database test suites
```bash
# PostgreSQL only
npm run test:integration:postgres

# MongoDB only
npm run test:integration:mongo

# Neo4j only
npm run test:integration:neo4j

# All databases via the Composite repository
npm run test:integration:composite
```
