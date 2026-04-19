db.getSiblingDB("admin").createUser({
  user: process.env.MONGO_BACKUP_USER,
  pwd: process.env.MONGO_BACKUP_PASSWORD,
  roles: [
    { role: "backup",      db: "admin" },  // read access across all DBs
    { role: "hostManager", db: "admin" }   // fsync + unlock on cluster
  ]
});

print("backup_agent created successfully.");