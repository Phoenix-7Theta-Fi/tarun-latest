import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectMongoDB from '../src/lib/mongodb.js';
import Order from '../src/models/Order.js';

// Load environment variables first
dotenv.config({ path: '../.env.local' });

async function clearOrders() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Delete all orders
    const result = await Order.deleteMany({});

    console.log(`Successfully deleted ${result.deletedCount} orders.`);
  } catch (error) {
    console.error('Error clearing orders:', error);
  } finally {
    // Close the mongoose connection
    await mongoose.connection.close();
  }
}

// Run the clear orders function
clearOrders();
