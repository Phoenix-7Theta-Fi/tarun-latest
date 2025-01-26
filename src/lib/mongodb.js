import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const envPath = path.join(rootDir, '.env.local');
console.log('Looking for .env.local at:', envPath);

const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result);
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectMongoDB() {
  if (cached.conn) {
    console.log('Using existing MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Add timeout
    };

    console.log('Creating new MongoDB connection with URI:', MONGODB_URI);
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB connected and tested successfully');
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    console.error('Connection string used:', MONGODB_URI);
    throw new Error(`MongoDB connection failed: ${e.message}`);
  }
}

export default connectMongoDB;
