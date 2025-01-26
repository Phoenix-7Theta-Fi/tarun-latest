import mongoose from 'mongoose';

// Define the schema
const OrderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  items: [{
    id: Number,
    name: String,
    emoji: String,
    price: Number,
    quantity: Number
  }],
  totalQuantity: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['waitlist', 'confirmed', 'dispatched'],
      message: '{VALUE} is not a valid status'
    },
    default: 'waitlist'
  },
  subStatus: {
    type: String,
    enum: {
      values: ['packed', 'unpacked'],
      message: '{VALUE} is not a valid sub-status'
    },
    required: function() {
      return this.status === 'confirmed';
    },
    default: 'unpacked'
  }
});

// Delete the model if it exists to prevent OverwriteModelError
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order;
