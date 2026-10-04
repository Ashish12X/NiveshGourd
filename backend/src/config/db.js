// backend/src/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('\n======================================================');
    console.error('❌ MONGODB CONFIGURATION ERROR:');
    console.error('MONGO_URI environment variable is missing.');
    console.error('Please configure MONGO_URI in your backend/.env file.');
    console.error('Example: MONGO_URI=mongodb://localhost:27017/sangyan');
    console.error('Or MongoDB Atlas: MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/sangyan');
    console.error('======================================================\n');
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
