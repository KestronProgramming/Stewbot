const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

async function dumpDatabaseStructure() {
  // Connect to MongoDB server (no deprecated options)
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();

  // Get the list of databases
  const dbList = await client.db().admin().listDatabases();
  
  for (const db of dbList.databases) {
    console.log(`\nDatabase: ${db.name}`);

    // Switch to the current database
    const currentDb = client.db(db.name);

    // Get the list of collections
    const collections = await currentDb.listCollections().toArray();
    
    for (const collection of collections) {
      console.log(`  Collection: ${collection.name}`);

      // Get the indexes for each collection
      const indexes = await currentDb.collection(collection.name).indexes();
      console.log(`    Indexes:`);
      indexes.forEach(index => {
        console.log(`      ${JSON.stringify(index)}\n`);
      });

      // (Optional) Fetch a sample document to infer schema structure
      const sampleDoc = await currentDb.collection(collection.name).findOne();
      if (sampleDoc) {
        console.log(`Sample Document:`);
        console.log(`${JSON.stringify(sampleDoc, null, 2)}\n`);
      } else {
        console.log(`No documents found in this collection.\n`);
      }
    }
  }

  await client.close();
}

dumpDatabaseStructure().catch(err => {
  console.error('Error dumping database structure:', err);
});
