import React from 'react';

export default function OrderCard({ order, onStatusChange, isHistorical = false }) {
  const handleStatusUpdate = async (newStatus) => {
    await onStatusChange(order.id, newStatus);
  };

  // Dynamic status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'packed':
        return 'bg-green-700 text-green-100';
      case 'dispatched':
        return 'bg-blue-600 text-blue-100';
      default:
        return 'bg-gray-600 text-gray-100';
    }
  };

  return (
    <div className={`
      bg-gray-800 
      border 
      border-gray-700 
      rounded-lg 
      shadow-lg 
      shadow-gray-900/50 
      p-5 
      mb-4 
      ${!isHistorical ? 'transition-all duration-300 hover:scale-[1.02] hover:border-gray-600' : ''}
    `}>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-700">
        <div>
          <h3 className="text-lg font-bold text-gray-100 mb-1">
            {order.customerName}
          </h3>
          <p className="text-sm text-gray-400">
            Order ID: {order.id}
          </p>
        </div>
        
        {/* Status Buttons */}
        {!isHistorical && (
      <div className="flex space-x-2">
        {order.status !== 'dispatched' && (
          <>
            <button
              onClick={() => handleStatusUpdate('unpacked')}
              className={`
                px-3
                py-1
                text-sm
                rounded
                transition-colors
                ${order.subStatus === 'unpacked'
                  ? 'bg-gray-700 text-white border-2 border-blue-500'
                  : 'bg-gray-700 text-gray-300 border border-gray-600 hover:border-gray-500'}
              `}
            >
              Unpacked
            </button>
            <button
              onClick={() => handleStatusUpdate('packed')}
              className={`
                px-3
                py-1
                text-sm
                rounded
                transition-colors
                ${order.subStatus === 'packed'
                  ? 'bg-green-700 text-white border-2 border-green-500'
                  : 'bg-gray-700 text-gray-300 border border-gray-600 hover:border-gray-500'}
              `}
            >
              Packed
            </button>
            {order.subStatus === 'packed' && (
              <button
                onClick={() => handleStatusUpdate('dispatched')}
                className="px-3 py-1 text-sm rounded transition-colors bg-blue-600 text-white hover:bg-blue-700"
              >
                Dispatch
              </button>
            )}
          </>
        )}
      </div>
        )}
      </div>
      {isHistorical && (
        <div className="mt-4 text-sm text-gray-400">
          Order Date: {new Date(order.timestamp).toLocaleString()}
        </div>
      )}

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        {order.items.map(item => (
          <div 
            key={item.id} 
            className="
              flex 
              justify-between 
              items-center 
              py-2 
              border-b 
              border-gray-700 
              last:border-b-0
            "
          >
            <div className="flex items-center">
              <span className="mr-3 text-2xl">{item.emoji}</span>
              <span className="text-gray-200 font-medium">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400">
                {item.quantity} × ₹{item.price.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="
        pt-3 
        border-t 
        border-gray-700 
        flex 
        justify-between 
        text-gray-200
        font-semibold
      ">
        <div className="flex justify-between w-full">
          <div>Total Quantity</div>
          <div>{order.totalQuantity}</div>
        </div>
      </div>
      
      {/* Total Cost */}
      <div className="
        mt-2 
        pt-3 
        border-t 
        border-gray-700 
        flex 
        justify-between 
        text-white 
        font-bold
      ">
        <div className="flex justify-between w-full">
          <div>Total Cost</div>
          <div>₹{order.totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-4 flex justify-end">
        <span className={`
          ${getStatusColor(order.status)}
          px-3 
          py-1 
          rounded-full 
          text-xs 
          uppercase 
          tracking-wider
        `}>
          {order.status}
        </span>
      </div>
    </div>
  );
}
