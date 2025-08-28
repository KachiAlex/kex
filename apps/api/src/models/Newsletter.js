const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
		unique: true,
		match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	},
	source: { type: String, default: 'web' }
}, { timestamps: true });

module.exports = mongoose.model('Newsletter', NewsletterSchema); 