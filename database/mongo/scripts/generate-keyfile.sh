#!/bin/bash
# Initialize replica set on first startup
mongosh --eval "
  try {
    rs.status();
    print('Replica set already initialized.');
  } catch(e) {
    rs.initiate({
      _id: 'rs0',
      members: [{ _id: 0, host: 'mongo-standalone:27017' }]
    });
    print('Replica set initialized.');
  }
"