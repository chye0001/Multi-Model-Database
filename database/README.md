# Start/Stop local databases
Starting up the local database instances simply navigate to the root of the project in the terminal.
Then execute the folllowing command: 

```bash
docker compose -f docker-compose.db.yml up -d
```
This will start up a local instance of a Postgress & Mongo database, using a default volume named: "default_volume". 
You can change and initilise different volumes using the following command:

```bash
DB_VOLUME="name_of_your_choice" docker compose -f docker-compose.db.yml up -d
```

or simply set the value of DB_VOLUME in the [.env](.env) file and run:
```bash
docker compose -f docker-compose.db.yml up -d
```

To stop the local database instances:
```bash
docker compose -f docker-compose.db.yml down
```




# Working with Prisma - Postgres ORM

## Initial Prisma setup after clonning repository
After pulling the code base, you need to sync your local database. You do this by calling the following command:

```bash
npm run prisma:push
```

This will read your [schema.prisma](./prisma/schema.prisma) file and push and apply it to the local database. 


Afterwards you need to run:

```bash
npm run prisma:generate
```
This will generate a database client, which the backend application can use to communicate with the database.


## Seeding the database
To seed the database with test data run the following command:
```bash
npm run prisma:seed
```
This will execute the [seed.ts](./prisma/seed.ts) file found under ./database/prisma.


## Reseting the database
To reset or truncate the entire database, in other words... 
This will delete all data and re-run migrations from scratch, just simply execute the following command:

```bash
npm run prisma:reset
```

## Creating migrations and applying them 
To make changes to the database, you should make changes to the [schema.prisma](./prisma/schema.prisma) file.
Afterwards run the following command:
```bash
npm run prisma:migrate
```
This will generate a migration file and place it in the [/migrations](./prisma/migrations/) folder and apply them directly to the database you are connected to. Afterwards it will automatically generate a database client and sync it with the changes to [schema.prisma](./prisma/schema.prisma) - the database has to be running for it to apply the changes, otherwise it will only create the migrations file.


## Connect to the Postgres Database
There are multiple ways to connect to the Postgres database, but the simplest is to do:
```bash
npm run prisma:studio
```

Otherwise you can connect using DataGrip or DBeaver - just a Database Client that supports Postgres.
The credentials can be found in the [.env](../.env) file located at the root of the project.






# Working with Mongoose - MongoDB ODM
Mongoose unlike Prisma does not have build in commands that can be run against the database instance like...
"seeding", "reseting", "migrating" etc...

Therefore inside the [scripts](./mongo/scripts/) folder, manual scripts has been written and will be
executed via package.json scripts to enable the some of the same features.

## Seeding the Database
To seed the monogo database simply run the following command:
TODO maybe seed on first container build?
```bash
npm run mongo:seed
```

## Reseting the Database
To reset the database wiping out all the data call the command:
```bash
npm run mongo:reset
```
This will basically drop the entire Mongo database. This is expected behavior, since Mongo does not
show any collections are databases, if there are no Collections with any Documents inside.
In other words if there are no data stored in the database, Mongo will not show the database.






# Working with Neogma - Neo4j OGM
...