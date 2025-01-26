import connectMongoDB from '../../lib/mongodb';
import Product from '../../models/Product';

export default async function handler(req, res) {
  console.log('API Route: Starting connection to MongoDB');
  await connectMongoDB();
  console.log('API Route: MongoDB connected');

  switch (req.method) {
    case 'GET':
      return getInventory(req, res);
    case 'PUT':
      return updateStock(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getInventory(req, res) {
  try {
    console.log('API Route: Fetching products from database');
    const products = await Product.find({});
    console.log('API Route: Products fetched:', products.length, 'items found');
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching inventory', error });
  }
}

async function updateStock(req, res) {
  try {
    const { id, currentStock, lowStockThreshold } = req.body;

    const updatedProduct = await Product.findOneAndUpdate(
      { id },
      { 
        currentStock, 
        lowStockThreshold 
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating stock', error });
  }
}
