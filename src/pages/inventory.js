import { useState, useEffect } from 'react';
import { FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      console.log('Fetching inventory from API...');
      const response = await fetch('/api/inventory');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Inventory data received:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }
      
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setLoading(false);
      // Show error in UI
      setProducts([]);
      alert('Failed to load inventory. Please check the console for details.');
    }
  };

  const getStockStatusColor = (product) => {
    if (product.currentStock === 0) return 'bg-red-500';
    if (product.currentStock <= product.lowStockThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleStockEdit = (product) => {
    setEditingProduct(product);
  };

  const handleStockUpdate = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingProduct.id,
          currentStock: editingProduct.currentStock,
          lowStockThreshold: editingProduct.lowStockThreshold
        })
      });

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === editingProduct.id ? editingProduct : p
        ));
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-green-400">
          Inventory Management
        </h1>

        {loading ? (
          <div className="text-center text-gray-400">Loading Inventory...</div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr className="text-left">
                  <th className="p-4">Product</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-center">Current Stock</th>
                  <th className="p-4 text-center">Low Stock Threshold</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr 
                    key={product.id} 
                    className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-4 flex items-center">
                      <span className="text-3xl mr-4">{product.emoji}</span>
                      <span className="font-semibold">{product.name}</span>
                    </td>
                    <td className="p-4 text-gray-400">{product.description}</td>
                    <td className="p-4 text-center">
                      {editingProduct && editingProduct.id === product.id ? (
                        <input 
                          type="number" 
                          value={editingProduct.currentStock}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct, 
                            currentStock: parseInt(e.target.value)
                          })}
                          className="w-20 text-center p-1 bg-gray-700 text-white rounded"
                        />
                      ) : (
                        product.currentStock
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingProduct && editingProduct.id === product.id ? (
                        <input 
                          type="number" 
                          value={editingProduct.lowStockThreshold}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct, 
                            lowStockThreshold: parseInt(e.target.value)
                          })}
                          className="w-20 text-center p-1 bg-gray-700 text-white rounded"
                        />
                      ) : (
                        product.lowStockThreshold
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div 
                        className={`
                          w-4 h-4 rounded-full mx-auto 
                          ${getStockStatusColor(product)}
                        `}
                        title={
                          product.currentStock === 0 
                            ? 'Out of Stock' 
                            : product.currentStock <= product.lowStockThreshold 
                            ? 'Low Stock' 
                            : 'In Stock'
                        }
                      />
                    </td>
                    <td className="p-4 text-center">
                      {editingProduct && editingProduct.id === product.id ? (
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={handleStockUpdate}
                            className="text-green-500 hover:text-green-400"
                          >
                            <FaCheck />
                          </button>
                          <button 
                            onClick={() => setEditingProduct(null)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStockEdit(product)}
                          className="text-blue-500 hover:text-blue-400"
                        >
                          <FaEdit />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
