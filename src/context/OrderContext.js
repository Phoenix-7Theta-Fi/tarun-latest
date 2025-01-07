import React, { createContext, useState } from 'react';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [waitlistOrder, setWaitlistOrder] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [processedOrders, setProcessedOrders] = useState([]);

  const updateCustomerName = (name) => {
    setCustomerName(name);
  };

  const addProcessedOrder = (order) => {
    setProcessedOrders([...processedOrders, order]);
  };

  return (
    <OrderContext.Provider value={{
      waitlistOrder,
      setWaitlistOrder,
      customerName,
      updateCustomerName,
      processedOrders,
      setProcessedOrders,  // Add this to allow direct setting of processed orders
      addProcessedOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
};