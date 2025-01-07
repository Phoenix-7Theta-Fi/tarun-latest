import { useState, useEffect } from 'react';
import OrderCard from '../components/OrderCard';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch only confirmed orders with their sub-status
      const response = await fetch('/api/orders?status=confirmed');
      const data = await response.json();
      
      // Ensure all orders have a subStatus
      const ordersWithStatus = data.map(order => ({
        ...order,
        subStatus: order.subStatus || 'unpacked'
      }));

      setOrders(ordersWithStatus);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newSubStatus) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: orderId, 
          subStatus: newSubStatus 
        })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === updatedOrder.id 
              ? {...updatedOrder, subStatus: newSubStatus} 
              : order
          )
        );
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status.');
    }
  };

  // Filter and categorize orders
  const filteredOrders = {
    all: orders,
    packed: orders.filter(order => order.subStatus === 'packed'),
    unpacked: orders.filter(order => order.subStatus === 'unpacked')
  };

  const renderOrderSection = (title, emoji, orders, emptyMessage) => (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center border-b border-gray-700 pb-2">
        <span className="mr-2 text-2xl">{emoji}</span>
        {title}
        <span className="ml-2 text-sm bg-gray-700 text-gray-300 px-2 py-1 rounded">
          {orders.length}
        </span>
      </h2>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="container mx-auto">
        {/* Header with Refresh and Filter */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-400">
            Order Management
          </h1>
          <div className="flex items-center space-x-4">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 text-gray-200 border border-gray-700 rounded px-3 py-2"
            >
              <option value="all">All Orders</option>
              <option value="packed">Packed Orders</option>
              <option value="unpacked">Unpacked Orders</option>
            </select>
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center"
            >
              <span className="mr-2">🔄</span> Refresh
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center text-gray-400 py-8">
            Loading orders...
          </div>
        )}

        {error && (
          <div className="bg-red-900 text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Orders Grid */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 gap-8">
            {filter === 'all' ? (
              <>
                {renderOrderSection(
                  'Unpacked Orders', 
                  '📦', 
                  filteredOrders.unpacked,
                  'No unpacked orders'
                )}
                {renderOrderSection(
                  'Packed Orders', 
                  '✅', 
                  filteredOrders.packed,
                  'No packed orders'
                )}
              </>
            ) : (
              renderOrderSection(
                filter === 'packed' ? 'Packed Orders' : 'Unpacked Orders',
                filter === 'packed' ? '✅' : '📦',
                filteredOrders[filter],
                filter === 'packed' ? 'No packed orders' : 'No unpacked orders'
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
