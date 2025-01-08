import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  FaUserCircle, 
  FaShoppingCart, 
  FaSearch, 
  FaPlus, 
  FaSave, 
  FaEdit, 
  FaTimes 
} from 'react-icons/fa';

export default function Customers() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New states for editing and adding
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    totalSpent: 0,
    totalOrders: 0
  });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      
      const sortedCustomers = data.sort((a, b) => b.totalSpent - a.totalSpent);
      
      setCustomers(sortedCustomers);
      setFilteredCustomers(sortedCustomers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerForm)
      });

      if (!response.ok) {
        throw new Error('Failed to add/update customer');
      }

      const newCustomer = await response.json();
      
      // Update customers list
      const updatedCustomers = customers.some(c => c.email === newCustomer.email)
        ? customers.map(c => c.email === newCustomer.email ? newCustomer : c)
        : [...customers, newCustomer];

      setCustomers(updatedCustomers);
      
      // Reset form and toggle
      setCustomerForm({
        name: '',
        email: '',
        phone: '',
        totalSpent: 0,
        totalOrders: 0
      });
      setIsAddingCustomer(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      totalSpent: customer.totalSpent,
      totalOrders: customer.totalOrders
    });
    setIsAddingCustomer(true);
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setIsAddingCustomer(false);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      totalSpent: 0,
      totalOrders: 0
    });
  };

  const fetchCustomerOrders = async (customerId) => {
    try {
      const response = await fetch(`/api/orders?customerId=${customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const orders = await response.json();
      setCustomerOrders(prev => ({
        ...prev,
        [customerId]: orders
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message);
    }
  };

  const toggleCustomerDetails = (customerId) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
    } else {
      setExpandedCustomer(customerId);
      if (!customerOrders[customerId]) {
        fetchCustomerOrders(customerId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-400">
            Customer Management
          </h1>
          <div className="flex space-x-4">
            <button 
              onClick={() => setIsAddingCustomer(!isAddingCustomer)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            >
              <FaPlus className="mr-2" /> 
              {isAddingCustomer ? 'Cancel' : 'Add Customer'}
            </button>
            <button
              onClick={fetchCustomers}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Customer Add/Edit Form */}
        {isAddingCustomer && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <form onSubmit={handleAddCustomer} className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name*"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                required
                className="bg-gray-700 text-white p-2 rounded"
              />
              <input
                type="email"
                placeholder="Email*"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                required
                className="bg-gray-700 text-white p-2 rounded"
                disabled={!!editingCustomer} // Disable email editing for existing customer
              />
              <input
                type="tel"
                placeholder="Phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                className="bg-gray-700 text-white p-2 rounded"
              />
              <input
                type="number"
                placeholder="Total Spent"
                value={customerForm.totalSpent}
                onChange={(e) => setCustomerForm({...customerForm, totalSpent: parseFloat(e.target.value)})}
                className="bg-gray-700 text-white p-2 rounded"
              />
              <input
                type="number"
                placeholder="Total Orders"
                value={customerForm.totalOrders}
                onChange={(e) => setCustomerForm({...customerForm, totalOrders: parseInt(e.target.value)})}
                className="bg-gray-700 text-white p-2 rounded"
              />
              <div className="flex space-x-2">
                <button 
                  type="submit" 
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                >
                  <FaSave className="mr-2" /> Save
                </button>
                {editingCustomer && (
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-red-600 text-white px-4 py-2 rounded hover: bg-red-700 flex items-center"
                  >
                    <FaTimes className="mr-2" /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search Customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded w-full"
          />
        </div>

        {/* Customer List */}
        {loading ? (
          <p>Loading customers...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <ul className="space-y-4">
            {filteredCustomers.map(customer => (
              <li 
                key={customer.email} 
                className="bg-gray-800 p-4 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => router.push(`/customer/${customer.id}`)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">{customer.name}</h3>
                    <p>Email: {customer.email}</p>
                    <p>Phone: {customer.phone}</p>
                    <p>Total Spent: ${customer.totalSpent.toFixed(2)}</p>
                    <p>Total Orders: {customer.totalOrders}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditCustomer(customer); }}
                      className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 flex items-center"
                    >
                      <FaEdit className="mr-1" /> Edit
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        router.push(`/customer/${customer._id}`); 
                      }}
                      className="bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
                {expandedCustomer === customer._id && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Order History:</h4>
                    {customerOrders[customer._id]?.length > 0 ? (
                      <ul className="space-y-2">
                        {customerOrders[customer._id].map(order => (
                          <li key={order.id} className="bg-gray-700 p-2 rounded">
                            <div className="flex justify-between">
                              <span>Order #{order.id}</span>
                              <span>${order.totalCost.toFixed(2)}</span>
                            </div>
                            <div className="text-sm text-gray-300">
                              {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.timestamp).toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400">No orders found</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
