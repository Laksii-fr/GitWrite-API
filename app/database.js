import mongoose from 'mongoose';
import settings from "./config.js";
// Function to connect to MongoDB
const connectDB = async () => {
  try {
    console.log('1) 🔗 Connecting to MongoDB...');
    await mongoose.connect(settings.DATABASE_URL);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Stop app if DB fails
  }
};

export default connectDB;
