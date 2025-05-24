const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local first, then .env if .env.local doesn't exist
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment variables from .env.local');
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env');
  dotenv.config();
} else {
  console.log('No .env or .env.local file found');
  dotenv.config(); // Still call dotenv.config() to load any environment variables
}

// Get MongoDB connection string from environment variables
const mongoURI = process.env.MONGODB_URI 

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB with URI:', 
                mongoURI.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://[username]:[password]@'));
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('Continuing without MongoDB functionality. UCC registrations and orders will not be saved.');
    // Don't exit the process, allow the application to run without MongoDB
  }
};

module.exports = connectDB; 