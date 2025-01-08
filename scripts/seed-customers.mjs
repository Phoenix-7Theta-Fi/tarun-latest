import connectMongoDB from '../src/lib/mongodb.js';
import Customer from '../src/models/Customer.js';

const DUMMY_CUSTOMERS = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    totalOrders: 5,
    totalSpent: 345.75
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 987-6543",
    totalOrders: 3,
    totalSpent: 212.50
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+1 (555) 456-7890",
    totalOrders: 7,
    totalSpent: 512.25
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily.brown@example.com",
    phone: "+1 (555) 234-5678",
    totalOrders: 2,
    totalSpent: 145.60
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david.wilson@example.com",
    phone: "+1 (555) 789-0123",
    totalOrders: 4,
    totalSpent: 276.90
  }
];

async function seedCustomers() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Clear existing customers
    await Customer.deleteMany({});

    // Insert dummy customers
    const insertedCustomers = await Customer.insertMany(DUMMY_CUSTOMERS);

    console.log(`Successfully seeded ${insertedCustomers.length} customers`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding customers:', error);
    process.exit(1);
  }
}

seedCustomers();