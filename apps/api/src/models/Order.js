const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
	{
		productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
		name: String,
		price: Number,
		quantity: Number,
		image: String,
	},
	{ _id: false }
);

const orderSchema = new mongoose.Schema(
	{
		reference: { type: String, required: true, unique: true },
		items: { type: [orderItemSchema], default: [] },
		amount: { type: Number, required: true },
		currency: { type: String, default: 'NGN' },
		customerEmail: { type: String, required: true },
		status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' },
		provider: { type: String, enum: ['paystack', 'flutterwave'], required: true },
		authorizationUrl: { type: String },
		providerReference: { type: String },
		meta: { type: Object, default: {} },
		escrowStatus: { type: String, enum: ['none', 'held', 'released'], default: 'none' },
		escrowReleasedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema); 