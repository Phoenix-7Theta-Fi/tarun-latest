import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OrderCard from '../../components/OrderCard';

export default function CustomerDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      // Fetch customer details and orders in one request
      const response = await fetch(`/api/customers?customerId=${id}`);
      const { orders, ...customerData } = await response.json();

      setCustomer(customerData);
      setOrders(orders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading customer details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-2xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="container mx-auto">
        {/* Customer Profile Header */}
        {customer && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center space-x-6">
              <div className="bg-gray-700 w-24 h-24 rounded-full flex items-center justify-center text-4xl">
                {customer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-green-400">{customer.name || 'Unknown'}</h1>
                <p className="text-gray-400">{customer.email || 'No email'}</p>
                <div className="mt-2 flex space-x-4">
                  <div>
                  <span className="font-semibold text-gray-200">Total Orders</span>
                  <p className="text-green-300">{orders?.length || 0}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-200">Total Spent</span>
                  <p className="text-green-300">₹{orders?.reduce((total, order) => total + (order.totalAmount || 0), 0).toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order History Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-green-400">
            Order History ({orders?.length || 0})
          </h2>
          
          {!orders?.length ? (
            <div className="bg-gray-800 p-6 rounded-xl text-center text-gray-400">
              No orders found for this customer
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {orders.map(order => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  isHistorical={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
