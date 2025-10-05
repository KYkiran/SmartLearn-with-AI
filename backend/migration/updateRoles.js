const mongoose = require('mongoose');
const config = require('../src/config');

async function migrateRoles() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to database for migration');

    // Update all student and instructor roles to learner
    const userResult = await mongoose.connection.db.collection('users').updateMany(
      { role: { $in: ['student', 'instructor'] } },
      { $set: { role: 'learner' } }
    );

    console.log(`Updated ${userResult.modifiedCount} user roles to 'learner'`);

    // Update course field from instructor to creator
    const courseResult = await mongoose.connection.db.collection('courses').updateMany(
      { instructor: { $exists: true } },
      [{ $rename: { instructor: 'creator' } }]
    );

    console.log(`Updated ${courseResult.modifiedCount} course instructor fields to creator`);

    // Update quiz field from instructor to creator
    const quizResult = await mongoose.connection.db.collection('quizzes').updateMany(
      { instructor: { $exists: true } },
      [{ $rename: { instructor: 'creator' } }]
    );

    console.log(`Updated ${quizResult.modifiedCount} quiz instructor fields to creator`);

    console.log('Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateRoles();
