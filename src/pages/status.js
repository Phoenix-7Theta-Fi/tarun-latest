import React, { useContext, useEffect, useState } from 'react';
import { OrderContext } from '../context/OrderContext';
import { useSearchParams } from 'next/navigation';

const WaitlistOrderCard = ({ order, onConfirm, onDelete }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="border border-gray-700 p-4 rounded-lg mb-4 bg-gray-800 shadow-md">
      <h3 className="text-xl font-bold mb-2 text-gray-100">Order Details</h3>
      <p className="text-gray-300"><strong>Order ID:</strong> {order.id}</p>
      <p className="text-gray-300"><strong>Customer Name:</strong> {order.customerName}</p>
      <p className="text-gray-300"><strong>Timestamp:</strong> {formatDate(order.timestamp)}</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-gray-100">Items:</h4>
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between border-b border-gray-700 py-2">
            <span className="text-gray-300">{item.emoji} {item.name}</span>
            <span className="text-gray-300">
              Qty: {item.quantity} | ₹{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between text-gray-300">
        <p><strong>Total Quantity:</strong> {order.totalQuantity}</p>
        <p><strong>Total Cost:</strong> ₹{order.totalCost.toFixed(2)}</p>
      </div>

      <div className="mt-4 flex space-x-4">
        <button 
          onClick={onConfirm} 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Confirm Order
        </button>
        <button 
          onClick={onDelete} 
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Delete Order
        </button>
      </div>
    </div>
  );
};

const ConfirmedOrderCard = ({ order }) => {
  return (
    <div className="bg-gray-700 border-l-4 border-green-500 p-4 rounded mb-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-green-300">{order.customerName}</p>
          <p className="text-sm text-gray-300">
            Order ID: {order.id}
          </p>
          <div className="mt-2">
            <p className="text-sm text-gray-300">Status:</p>
            <div className="flex space-x-2 mt-1">
              <div className={`px-3 py-1 rounded ${
                order.status === 'packed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                Packed
              </div>
              <div className={`px-3 py-1 rounded ${
                order.status === 'confirmed' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                Unpacked
              </div>
            </div>
          </div>
        </div>
        <span className="text-green-400 font-semibold">
          ₹{order.totalCost.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

const StatusPage = () => {
  const { processedOrders, setProcessedOrders } = useContext(OrderContext);
  const searchParams = useSearchParams();
  const [waitlistOrders, setWaitlistOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch waitlist orders
      const waitlistResponse = await fetch('/api/orders?status=waitlist');
      const waitlistOrders = await waitlistResponse.json();
      setWaitlistOrders(waitlistOrders);

      // Fetch confirmed and packed orders
      const processedResponse = await fetch('/api/orders');
      const allOrders = await processedResponse.json();
      const processedOrders = allOrders.filter(order => 
        ['confirmed', 'packed'].includes(order.status)
      );
      setProcessedOrders(processedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Set up an interval to refresh orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async (orderId) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: orderId, 
          status: 'confirmed'
        }),
      });

      if (response.ok) {
        const confirmedOrder = await response.json();
        // Remove from waitlist and add to processed orders
        setWaitlistOrders(prev => prev.filter(order => order.id !== orderId));
        setProcessedOrders(prev => [...prev, confirmedOrder]);
      }
    } catch (error) {
      console.error('Error confirming order:', error);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: orderId, 
          status: 'cancelled' 
        }),
      });

      if (response.ok) {
        setWaitlistOrders(prev => 
          prev.filter(order => order.id !== orderId)
        );
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-green-400">Order Status Management</h1>
        <button
          onClick={fetchOrders}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">🔄</span> Refresh Orders
        </button>
      </div>
      
      {loading ? (
        <div className="text-center text-gray-400 py-8">
          Loading orders...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Waitlist Orders Section */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400 border-b border-gray-700 pb-2">
              🕒 Waitlist Orders
            </h2>
            {waitlistOrders.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No orders in waitlist
              </div>
            ) : (
              waitlistOrders.map((order) => (
                <WaitlistOrderCard
                  key={order.id}
                  order={order}
                  onConfirm={() => handleConfirm(order.id)}
                  onDelete={() => handleDelete(order.id)}
                />
              ))
            )}
          </div>

          {/* Confirmed Orders Section */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-400 border-b border-gray-700 pb-2">
              ✅ Confirmed Orders
            </h2>
            {processedOrders.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No confirmed orders
              </div>
            ) : (
              processedOrders.map((order) => (
                <ConfirmedOrderCard
                  key={order.id}
                  order={order}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusPage;
