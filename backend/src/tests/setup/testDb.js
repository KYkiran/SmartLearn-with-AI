const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Connect to in-memory MongoDB for testing
beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to test database');
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
});

// Clean up database between tests
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  } catch (error) {
    console.error('Test cleanup error:', error);
  }
});

// Disconnect and stop MongoDB after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongod) {
      await mongod.stop();
    }
    
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Test teardown error:', error);
  }
});
