import { useState, useEffect, useContext } from 'react';
import { OrderContext } from '../context/OrderContext';
import connectMongoDB from '../lib/mongodb';
import Product from '../models/Product';

export async function getServerSideProps() {
  await connectMongoDB();
  const products = await Product.find({});
  return {
    props: {
      initialProducts: JSON.parse(JSON.stringify(products))
    }
  };
}

export default function OrderProcessing({ initialProducts }) {
  const { customerName, updateCustomerName, addProcessedOrder } = useContext(OrderContext);
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});

  const updateProductQuantity = (productId, quantity) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0.5, parseFloat(quantity) || 0.5)
    }));
  };

  const addToCart = (product) => {
    const quantity = quantities[product.id] || 1;
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? {...item, quantity: existingItem.quantity + quantity}
          : item
      ));
    } else {
      setCart([...cart, {...product, quantity}]);
    }
    // Reset quantity after adding to cart
    setQuantities(prev => ({...prev, [product.id]: 1}));
  };

  const updateQuantity = (productId, newQuantity) => {
    setCart(cart.map(item => 
      item.id === productId 
        ? {...item, quantity: newQuantity} 
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const processOrder = async () => {
    if (cart.length === 0 || !customerName) {
      alert('Please add items to cart and enter customer name');
      return;
    }

    try {
      const newOrder = {
        id: Date.now().toString(),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          emoji: item.emoji,
          price: item.price,
          quantity: item.quantity
        })),
        totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        totalCost: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        customerName: customerName,
        customerEmail: `${customerName.toLowerCase().replace(/\s+/g, '')}@default.com`,
        status: 'waitlist'
      };

      console.log('Sending order data:', newOrder);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const createdOrder = await response.json();
      console.log('Order created successfully:', createdOrder);

      // Clear the cart and customer name after successful order creation
      setCart([]);
      updateCustomerName('');
      
      // Redirect to status page to see the waitlist order
      window.location.href = '/status';
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Failed to create order: ' + error.message);
    }
  };

  const totalCost = cart.reduce((total, item) => 
    total + (item.price * item.quantity), 0
  );

  return (
    <div className="container mx-auto p-6 flex">
      <div className="w-2/3 grid grid-cols-3 gap-4">
        {initialProducts.map(product => (
          <div 
            key={product.id} 
            className="border p-4 rounded-lg text-center hover:shadow-md"
          >
            <div className="text-6xl mb-4">{product.emoji}</div>
            <h3 className="font-bold">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
            <p className="font-semibold">₹{product.price.toFixed(2)}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={quantities[product.id] || 1}
                onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                className="w-16 border rounded text-center bg-white text-black p-2"
              />
              <button
                onClick={() => addToCart(product)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="w-1/3 pl-6">
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Cart</h2>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center mb-2">
              <div>
                {item.emoji} {item.name}
                <input 
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0.5)}
                  className="w-16 ml-2 border rounded text-center bg-white text-black"
                />
              </div>
              <div className="flex items-center">
                <span className="mr-2">₹{(item.price * item.quantity).toFixed(2)}</span>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
          <div className="mt-4 pt-2 border-t">
            <div className="mb-4">
              <label htmlFor="customerName" className="block text-sm font-medium mb-1">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => updateCustomerName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter customer name"
              />
            </div>
            <button 
              onClick={processOrder}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors"
              disabled={cart.length === 0}
            >
              Process Order
            </button>
            <div className="mt-2">
              <strong>Total: ₹{totalCost.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
