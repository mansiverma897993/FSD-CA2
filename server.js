require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./src/app');

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is required. Add it to your .env file.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Student Feedback API is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error.message);
    process.exit(1);
  });