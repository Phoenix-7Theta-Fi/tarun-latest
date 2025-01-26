import React, { useContext, useEffect, useState } from 'react';
import { OrderContext } from '../context/OrderContext';
import { useSearchParams } from 'next/navigation';
import OrderCard from '../components/OrderCard';

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

const handleStatusUpdate = async (orderId, newStatus) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: orderId,
        status: newStatus === 'dispatched' ? 'dispatched' : 'confirmed',
        subStatus: newStatus !== 'dispatched' ? newStatus : undefined
      }),
    });

    if (response.ok) {
      const updatedOrder = await response.json();
      setProcessedOrders(prev => {
        if (newStatus === 'dispatched') {
          return prev.filter(order => order.id !== orderId);
        }
        return prev.map(order =>
          order.id === orderId ? updatedOrder : order
        );
      });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
  }
};

const StatusPage = () => {
  const { processedOrders, setProcessedOrders } = useContext(OrderContext);
  const searchParams = useSearchParams();
  const [waitlistOrders, setWaitlistOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      
      // Clear existing orders while fetching new ones
      setWaitlistOrders([]);
      setProcessedOrders([]);

      // Fetch both waitlist and confirmed orders in parallel
      const [waitlistResponse, processedResponse] = await Promise.all([
        fetch('/api/orders?status=waitlist'),
        fetch('/api/orders?status=confirmed')
      ]);

      // Check for failed responses
      if (!waitlistResponse.ok || !processedResponse.ok) {
        throw new Error('Failed to fetch orders');
      }

      const [waitlistOrders, processedOrders] = await Promise.all([
        waitlistResponse.json(),
        processedResponse.json()
      ]);

      // Validate and transform orders
      const validWaitlist = waitlistOrders.filter(order => 
        order.id && order.timestamp && order.status === 'waitlist'
      );
      
      const validProcessed = processedOrders
        .filter(order => 
          order.id && order.timestamp && order.status === 'confirmed'
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Update state with validated orders
      setWaitlistOrders(validWaitlist);
      setProcessedOrders(validProcessed);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Show error state
      setWaitlistOrders([]);
      setProcessedOrders([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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
          status: 'confirmed',
          subStatus: 'unpacked'
        }),
      });

      if (response.ok) {
        const confirmedOrder = await response.json();
        
        // Remove from waitlist
        setWaitlistOrders(prev => 
          prev.filter(order => order.id !== orderId)
        );
        
        // Add to processed orders
        setProcessedOrders(prev => {
          // Check if the order already exists
          const existingOrderIndex = prev.findIndex(o => o.id === confirmedOrder.id);
          
          if (existingOrderIndex > -1) {
            // Update existing order
            const updatedOrders = [...prev];
            updatedOrders[existingOrderIndex] = confirmedOrder;
            return updatedOrders;
          } else {
            // Add new order
            return [confirmedOrder, ...prev];
          }
        });
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

  const handleRefreshOrders = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-green-400">Order Status Management</h1>
        <button
          onClick={handleRefreshOrders}
          className={`
            bg-blue-600 
            text-white 
            px-4 
            py-2 
            rounded 
            hover:bg-blue-700 
            transition-colors 
            flex 
            items-center
            ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <span className="flex items-center">
              <svg 
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Refreshing...
            </span>
          ) : (
            <span className="flex items-center">
              <span className="mr-2">🔄</span> Refresh Orders
            </span>
          )}
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
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusUpdate}
                  showDispatchButton={true}
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
