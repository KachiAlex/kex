const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		description: { type: String, default: '' },
		price: { type: Number, required: true, min: 0 },
		quantity: { type: Number, required: true, min: 0 },
		category: { type: String, default: 'general' },
		images: { type: [String], default: [] },
		featured: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Product', productSchema); 