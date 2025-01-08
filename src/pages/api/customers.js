import connectMongoDB from '../../lib/mongodb';
import Customer from '../../models/Customer';

export default async function handler(req, res) {
  await connectMongoDB();

  switch (req.method) {
    case 'GET':
      return getCustomers(req, res);
    case 'POST':
      return createOrUpdateCustomer(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getCustomers(req, res) {
  try {
    const customers = await Customer.find({}).sort({ totalSpent: -1 });
    return res.status(200).json(customers);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching customers', error });
  }
}

async function createOrUpdateCustomer(req, res) {
  try {
    const { name, email, phone, totalSpent = 0, totalOrders = 0 } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        message: 'Name and email are required fields' 
      });
    }

    // Check if customer already exists by email
    let customer = await Customer.findOne({ email });

    if (customer) {
      // Update existing customer
      customer.name = name;
      customer.phone = phone;
      customer.totalSpent += totalSpent;
      customer.totalOrders += totalOrders;

      await customer.save();
      return res.status(200).json(customer);
    } else {
      // Create new customer
      const newCustomer = new Customer({
        id: Date.now(), // Use timestamp as unique ID
        name,
        email,
        phone,
        totalSpent,
        totalOrders
      });

      await newCustomer.save();
      return res.status(201).json(newCustomer);
    }
  } catch (error) {
    console.error('Customer creation/update error:', error);
    return res.status(500).json({ 
      message: 'Error processing customer', 
      error: error.message 
    });
  }
}