const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: { type: String, default: '' },
		email: { type: String, required: true, unique: true, index: true },
		passwordHash: { type: String, required: true },
		role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
		phone: { type: String, default: '' },
		avatar: { type: String, default: '' },
		emailVerified: { type: Boolean, default: false },
		emailOtp: { type: String, default: null },
		emailOtpExpiresAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('User', userSchema); 