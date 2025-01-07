import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import connectDB from '../src/lib/mongodb.js';

const FERTILIZER_PRODUCTS = [
  {
    id: 1,
    name: "Nitrogen-Rich Blend",
    emoji: "🌱",
    description: "High nitrogen content for leafy growth",
    price: 45.99,
    category: "Nitrogen Fertilizers"
  },
  {
    id: 2,
    name: "Phosphorus Power",
    emoji: "💥",
    description: "Boosts root development and flower formation",
    price: 52.50,
    category: "Phosphorus Fertilizers"
  },
  {
    id: 3,
    name: "Potassium Pro",
    emoji: "💪",
    description: "Enhances plant strength and disease resistance",
    price: 49.75,
    category: "Potassium Fertilizers"
  },
  {
    id: 4,
    name: "Organic Compost Mix",
    emoji: "♻️",
    description: "100% natural nutrient-rich compost",
    price: 35.25,
    category: "Organic Fertilizers"
  },
  {
    id: 5,
    name: "Micronutrient Miracle",
    emoji: "🔬",
    description: "Comprehensive trace element supplement",
    price: 59.99,
    category: "Specialty Fertilizers"
  },
  {
    id: 6,
    name: "Liquid Nitrogen Spray",
    emoji: "💦",
    description: "Quick-acting liquid nitrogen solution",
    price: 39.50,
    category: "Liquid Fertilizers"
  },
  {
    id: 7,
    name: "Slow-Release Granules",
    emoji: "⏳",
    description: "Gradual nutrient release for sustained growth",
    price: 54.25,
    category: "Specialty Fertilizers"
  },
  {
    id: 8,
    name: "Soil Health Booster",
    emoji: "🌍",
    description: "Improves soil structure and microbial activity",
    price: 47.75,
    category: "Soil Amendments"
  },
  {
    id: 9,
    name: "Hydroponic Nutrient Pack",
    emoji: "💧",
    description: "Complete nutrient solution for hydroponic systems",
    price: 62.50,
    category: "Specialty Fertilizers"
  },
  {
    id: 10,
    name: "Eco-Friendly Pellets",
    emoji: "🌿",
    description: "Sustainable, environmentally friendly fertilizer",
    price: 41.25,
    category: "Organic Fertilizers"
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Clear existing products
    await Product.deleteMany({});

    // Insert new products
    const insertedProducts = await Product.insertMany(FERTILIZER_PRODUCTS);
    
    console.log(`Successfully seeded ${insertedProducts.length} products`);
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();