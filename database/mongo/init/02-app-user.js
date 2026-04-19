db.getSiblingDB("admin").createUser({
  user: process.env.MONGO_APP_USER,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [
    { role: "readWrite", db: "mongo" }  // read, insert, update, delete on your app DB only
    // readWrite does NOT grant: drop, createCollection, createIndex, dbAdmin, or any cluster actions
  ]
});

print("app user created successfully.");