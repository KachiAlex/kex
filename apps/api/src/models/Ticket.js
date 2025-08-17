const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, index: true },
		subject: { type: String, required: true },
		message: { type: String, required: true },
		status: { type: String, enum: ['open', 'closed'], default: 'open' }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Ticket', TicketSchema); 