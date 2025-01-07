import connectMongoDB from '../../lib/mongodb';
import Order from '../../models/Order';

export default async function handler(req, res) {
  try {
    await connectMongoDB();

    switch (req.method) {
      case 'POST':
        return createOrder(req, res);
      case 'GET':
        return getOrders(req, res);
      case 'PUT':
        return updateOrderStatus(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Database connection error', error: error.message });
  }
}

async function createOrder(req, res) {
  try {
    const { id, items, totalQuantity, totalCost, customerName } = req.body;

    if (!id || !items || !totalQuantity || !totalCost || !customerName) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'All fields are required'
      });
    }

    const orderData = {
      ...req.body,
      status: 'waitlist', // Ensure status is set to waitlist
      subStatus: undefined, // No subStatus for waitlist orders
      timestamp: new Date()
    };

    const newOrder = new Order(orderData);
    await newOrder.validate();
    const savedOrder = await newOrder.save();

    const transformedOrder = {
      id: savedOrder.id,
      customerName: savedOrder.customerName,
      items: savedOrder.items,
      totalQuantity: savedOrder.totalQuantity,
      totalCost: savedOrder.totalCost,
      status: savedOrder.status,
      timestamp: savedOrder.timestamp
    };

    return res.status(201).json(transformedOrder);
  } catch (error) {
    console.error('Error creating order:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        error: error.message,
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    return res.status(400).json({
      message: 'Error creating order',
      error: error.message
    });
  }
}

async function getOrders(req, res) {
  try {
    const { status, subStatus } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    if (subStatus) {
      query.subStatus = subStatus;
    }

    console.log('Fetching orders with query:', query);

    const orders = await Order.find(query).sort({ timestamp: -1 });

    // Transform orders to include required fields
    const transformedOrders = orders.map(order => ({
      id: order.id,
      customerName: order.customerName || 'Anonymous',
      items: order.items.map(item => ({
        id: item.id,
        emoji: item.emoji || '📦',
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      totalCost: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: order.status,
      subStatus: order.subStatus,
      timestamp: order.timestamp
    }));

    console.log('Returning transformed orders:', transformedOrders);

    return res.status(200).json(transformedOrders);
  } catch (error) {
    console.error('Error retrieving orders:', error);
    return res.status(500).json({
      message: 'Error retrieving orders',
      error: error.message
    });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id, status, subStatus } = req.body;

    console.log('Updating order status:', { id, status, subStatus });

    // Prepare update object
    const updateData = {};

    // If status is provided, update status
    if (status) {
      updateData.status = status;
      // If moving to 'confirmed' and subStatus is not provided, set default
      if (status === 'confirmed' && !subStatus) {
        updateData.subStatus = 'unpacked';
      }
    }

    // If subStatus is provided, update subStatus
    if (subStatus) {
      // Validate subStatus
      if (!['packed', 'unpacked'].includes(subStatus)) {
        return res.status(400).json({
          message: 'Invalid sub-status',
          error: 'Sub-status must be either "packed" or "unpacked"'
        });
      }
      updateData.subStatus = subStatus;
    }

    // Find and update the order
    const updatedOrder = await Order.findOneAndUpdate(
      { id },
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedOrder) {
      console.log('Order not found for update:', id);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Order updated successfully:', updatedOrder);

    // Transform the updated order for response
    const transformedOrder = {
      id: updatedOrder.id,
      customerName: updatedOrder.customerName,
      items: updatedOrder.items,
      totalQuantity: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      totalCost: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: updatedOrder.status,
      subStatus: updatedOrder.subStatus,
      timestamp: updatedOrder.timestamp
    };

    return res.status(200).json(transformedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(400).json({
      message: 'Error updating order status',
      error: error.message
    });
  }
}
