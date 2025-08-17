const express = require('express');
const { z, ZodError } = require('zod');
const Ticket = require('../models/Ticket');

const router = express.Router();

const createSchema = z.object({ email: z.string().email(), subject: z.string().min(1), message: z.string().min(1) });

router.post('/', async (req, res) => {
	try {
		const { email, subject, message } = createSchema.parse(req.body);
		const t = await Ticket.create({ email, subject, message });
		return res.json(t);
	} catch (e) {
		if (e instanceof ZodError) return res.status(400).json({ error: 'Invalid payload', details: e.errors });
		return res.status(500).json({ error: 'Failed to create ticket' });
	}
});

router.get('/', async (req, res) => {
	try {
		const { email } = req.query;
		const query = email ? { email } : {};
		const tickets = await Ticket.find(query).sort({ createdAt: -1 });
		return res.json(tickets);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch tickets' });
	}
});

module.exports = router; 