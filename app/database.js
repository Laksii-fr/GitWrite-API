import mongoose from 'mongoose';
import settings from "./config.js";

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    console.log('1) 🔗 Connecting to MongoDB...');
    
    if (!settings.DATABASE_URL) {
      throw new Error('No database URL found. Please set MONGO_ATLAS_URL or DATABASE_URL environment variable.');
    }
    
    console.log('Database URL type:', settings.DATABASE_URL.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
    
    await mongoose.connect(settings.DATABASE_URL, {
      // MongoDB Atlas connection options (updated for newer Mongoose versions)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.name === 'MongoNetworkError') {
      console.error('Network error - please check your internet connection and MongoDB Atlas cluster status');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('Server selection error - please check your MongoDB Atlas connection string and network access');
    } else if (error.name === 'MongoParseError') {
      console.error('Connection string parse error - please check your MONGO_ATLAS_URL format');
    }
    
    process.exit(1); // Stop app if DB fails
  }
};

export default connectDB;
