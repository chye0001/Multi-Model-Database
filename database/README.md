# Start/Stop local databases
Starting up the local database instances simply navigate to the root of the project in the terminal.
Then execute the folllowing command: 

```bash
docker compose -f docker-compose.db.yml up -d
```
This will start up a local instance of a Postgress & Mongo & Neo4j databases, using a default volume named for the postgres db instance: "default_volume". 
You can change and initilise different volumes using the following command:

```bash
DB_VOLUME="name_of_your_choice" docker compose -f docker-compose.db.yml up -d
```

or simply set the value of DB_VOLUME in the [.env](.env) file and run (these volume configuration currently is only supported for the postgres db instance):
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


## Connect to the Postgres Database UI
There are multiple ways to connect to the Postgres database, but the simplest is to do:
```bash
npm run prisma:studio
```

Otherwise you can connect using DataGrip or DBeaver - just a Database Client that supports Postgres.
The credentials can be found in the [.env](../.env) file located at the root of the project.



# Postgres - Backup & Restore

## Backup
Initially when you start up the containers using docker compose, it will fail, since there are no user called "backup_user".
This user needs to be created. 

To create the user start up the containers normally as state in the begining of this README.md.
The posgres_backup service will fail, but the main postgres_database should start up with no problems.

Then do:
```bash
npm run prisma:migrate
npm run prisma:seed
```
The creation of the backup user has been added to migrations - this is not ideal but just a school project, meh.

Then add the following credentials to your private .env file:
POSTGRES_BACKUP_USER=backup_user
POSTGRES_BACKUP_PASSWORD=strongpassword

Then restart the containers, and the the periodical backups should run every 24 hours, altough only locally.. for now...

## Backups on demand
To create any backups on demand, without waiting the 24 hours simply call this command:
```bash
npm run postgres:backup
```


## Restore

If you followed the steps defined under "Backup" you should now have a backup file you can apply - [backups](./postgres/backups/base/)
Then call the custome restore script:
```bash
npm run postgres:restore
```

Afterwards do the cleanup step by calling:
```bash
npm run postgres:restore:cleanup
```







# Working with Mongoose - MongoDB ODM
Mongoose unlike Prisma does not have build in commands that can be run against the database instance like...
"seeding", "reseting", "migrating" etc...

Therefore inside the [scripts](./mongo/scripts/) folder, manual scripts has been written and will be
executed via package.json scripts to enable the some of the same features.

## Seeding the Database
To seed the monogo database simply run the following command:
```bash
npm run mongo:seed
```
Another option is to do a migration, which will be covered at the buttom of this readme.


## Reseting the Database
To reset the database wiping out all the data call the command:
```bash
npm run mongo:reset
```
This will basically drop the entire Mongo database. This is expected behavior, since Mongo does not
show any collections are databases, if there are no Collections with any Documents inside.
In other words if there are no data stored in the database, Mongo will not show the database.

## Connection via MongoDB Compass
You can connect to MongoDB Compass by modifying the connection string following the patteren based on the user, descirbed in the [.env.example](../.env.example)



# Mongo - Backup & Restore

## Backup

Prerequisite:
Ensure your private .env file contains the correct mongo user credentials.
See [.env.example](../.env.example).

On the very first start up of the mongo containers, when volume is just created, it will create two users:
- backup_agent (this user only has priviledges to create backups and restore them)
- app_user (this user can only read, create, update and delete)

After seeding of the mongo database, you can take a physical backup calling:
```bash
npm run mongo:backup
```
This will store the backup at this [location](./mongo/backups/base/).

## Restore 
To restore the database with the backup simply call:
```bash
npm run mongo:restore
```
This will stop the container, wipe the current volume, apply the physical backup and then restart the container automatically.







# Working with Neogma - Neo4j OGM

## Seeding the database
To seed the Neo4j graph database use execute this command - script found [here](./neo4j/scripts/seed.ts):
```bash
npm run neo4j:seed
```
Another option is to do a migration, which will be covered at the buttom of this readme.


## Reseting the database
To reset or truncate the database run the command:
```bash
npm run neo4j:reset
```

## Opening up Neo4j Database Management Tool
After you have started up the docker containers, the management tool should be availabe at: http://localhost:7474/browser/
The port might be different check that in the Docker Desktop app.

# Neo4j - Backup & Restore

## Backup
Initially on the first start up of the compose file, Neo4j will do an automatic backup, which will run every 24 hours. This backup will be placed in the backup folder under Neo4j, the [location](./neo4j/backups/base/) (This is not a physical backup since this is not supported in the comunity edition... so its a logical backup ie. a dumpfile).

To do manual backup, simply run:
```bash
npm run neo4j:backup
```
This will place the "backup" in the same location.

## Restore
To restore any backup simply run:
```bash
npm run neo4j:restore
```
This will prompt you to select a backup, located in the backups folder under Neo4j in the database folder and apply this.




# Data migration from Postgres --> MongoDB & Neo4j

## Migration
When migrating all the data from Postgres over to MongoDB & Neo4j, you first need to make sure that the Postgres database is seeded. As the Postgres database acts as the soruce of truth. Before seeding the Postgres database, ensure all migrations are applied localy.

After it has been seeded execute:
```bash
npm run all-databases:migrate
```

## Reseting / Truncating all databases
You can start from scrath by truncating all databases using a single command:
```bash
npm run all-databases:reset
```
