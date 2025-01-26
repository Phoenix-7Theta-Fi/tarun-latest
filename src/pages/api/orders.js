import connectMongoDB from '../../lib/mongodb';
import Order from '../../models/Order';
import Product from '../../models/Product';
import Customer from '../../models/Customer';
import mongoose from 'mongoose';

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

// Helper function to get order count for the current day
async function getTodayOrderCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await Order.countDocuments({
    timestamp: {
      $gte: today,
      $lt: tomorrow
    }
  });
}

async function createOrder(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, totalQuantity, totalCost, customerName, customerEmail } = req.body;

    if (!items || !totalQuantity || !totalCost || !customerName) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'All fields are required'
      });
    }

    // Find or create customer with transaction
    let customer = await Customer.findOne({ 
      $or: [
        { name: customerName },
        { email: customerEmail }
      ]
    }).session(session);

    if (!customer) {
      customer = new Customer({
        id: Date.now(),
        name: customerName,
        email: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '')}@default.com`,
        totalOrders: 1,
        totalSpent: totalCost,
        orders: []
      });
      await customer.save({ session });
    } else {
      // Update existing customer
      customer.totalOrders += 1;
      customer.totalSpent += totalCost;
      await customer.save({ session });
    }

    // Reduce stock levels for each product
    for (const item of items) {
      await Product.findOneAndUpdate(
        { id: item.id },
        { $inc: { currentStock: -item.quantity } },
        { session }
      );
    }

    // Generate order ID in format YYMMDDN
    const now = new Date();
    const orderCount = await getTodayOrderCount() + 1;
    const orderId = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${orderCount}`;

    // Create order
    const orderData = {
      ...req.body,
      id: orderId,
      customerId: customer._id,
      status: 'waitlist',
      timestamp: now
    };

    const newOrder = new Order(orderData);
    await newOrder.save({ session });

    // Add order to customer's orders array using $push
    await Customer.findByIdAndUpdate(
      customer._id, 
      { 
        $push: { orders: newOrder._id },
        $set: { lastOrderDate: new Date() }
      },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      order: {
        id: newOrder.id,
        customerName: newOrder.customerName,
        items: newOrder.items,
        totalQuantity: newOrder.totalQuantity,
        totalCost: newOrder.totalCost,
        status: newOrder.status,
        timestamp: newOrder.timestamp
      },
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent
      }
    });
  } catch (error) {
    // Rollback transaction in case of error
    await session.abortTransaction();
    session.endSession();

    console.error('Detailed Order Creation Error:', error);
    return res.status(500).json({
      message: 'Error creating order',
      error: error.toString(),
      stack: error.stack
    });
  }
}

async function getOrders(req, res) {
  try {
    const { status, subStatus, customerId, dispatchedDate } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    if (subStatus) {
      query.subStatus = subStatus;
    }
    if (customerId) {
      query.customerId = customerId;
    }
    if (dispatchedDate) {
      const startDate = new Date(dispatchedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dispatchedDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.status = 'dispatched';
      query.dispatchedAt = {
        $gte: startDate,
        $lte: endDate
      };
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
      timestamp: order.timestamp,
      dispatchedAt: order.dispatchedAt
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, status, subStatus } = req.body;

    console.log('Updating order status:', { id, status, subStatus });

    // Find the order first to validate and get customer info
    const existingOrder = await Order.findOne({ id }).session(session);
    if (!existingOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Prepare update object
    const updateData = {};

    // Handle status update
    if (status) {
      if (status === 'dispatched') {
        if (existingOrder.subStatus !== 'packed') {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: 'Invalid order state',
            error: 'Order must be packed before dispatching'
          });
        }
        const dispatchTime = new Date();
        updateData.status = 'dispatched';
        updateData.subStatus = undefined;
        updateData.dispatchedAt = dispatchTime;
        
        // Update customer's history when dispatching
        await Customer.findByIdAndUpdate(
          existingOrder.customerId,
          {
            $set: {
              [`orderHistory.${existingOrder.id}`]: {
                ...existingOrder.toObject(),
                status: 'dispatched',
                dispatchedAt: dispatchTime
              }
            }
          },
          { session }
        );
      } else {
        updateData.status = status;
        if (status === 'confirmed' && !subStatus) {
          updateData.subStatus = 'unpacked';
        }
      }
    }

    // Handle subStatus update if not dispatching
    if (subStatus && status !== 'dispatched') {
      if (!['packed', 'unpacked'].includes(subStatus)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: 'Invalid sub-status',
          error: 'Sub-status must be either "packed" or "unpacked"'
        });
      }
      updateData.subStatus = subStatus;
    }

    // Update the order
    const updatedOrder = await Order.findOneAndUpdate(
      { id },
      updateData,
      {
        new: true,
        runValidators: true,
        session
      }
    );

    await session.commitTransaction();
    session.endSession();

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
      timestamp: updatedOrder.timestamp,
      dispatchedAt: updatedOrder.dispatchedAt
    };

    return res.status(200).json(transformedOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error updating order status:', error);
    return res.status(400).json({
      message: 'Error updating order status',
      error: error.message
    });
  }
}
