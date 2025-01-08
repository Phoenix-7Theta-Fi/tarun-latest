import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: { 
    type: String 
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  orders: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
    default: []
  },
  lastOrderDate: {
    type: Date
  }
});

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
