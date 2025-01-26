import { useState, useEffect } from 'react';

export default function History() {
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(today);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch today's orders when component mounts
    handleDateChange(today);
  }, []);

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    try {
      const res = await fetch(`/api/orders?dispatchedDate=${date}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-green-400">Order History</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
            Select Date
          </label>
          <input
            type="date"
            id="date"
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-green-500 focus:ring-green-500 sm:text-sm"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        {orders.length > 0 ? (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Order ID</p>
                    <p className="text-lg font-semibold text-green-400">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Customer</p>
                    <p className="text-lg font-semibold text-gray-100">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Products</p>
                    <ul className="list-disc list-inside text-gray-100">
                      {order.items.map((item, index) => (
                        <li key={index}>
                          {item.emoji} {item.name} - Quantity: {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Dispatch Time</p>
                    <p className="text-lg font-semibold text-gray-100">
                      {order.dispatchedAt ? new Date(order.dispatchedAt).toLocaleString() : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center mt-4 bg-gray-800 rounded-lg p-6">
            {selectedDate ? 'No orders found for this date' : 'Select a date to view orders'}
          </p>
        )}
      </div>
    </div>
  );
}
