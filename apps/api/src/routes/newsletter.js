const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');

router.post('/subscribe', async (req, res) => {
	try {
		const { email, source } = req.body || {};
		const normalized = String(email || '').trim().toLowerCase();
		if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
			return res.status(400).json({ error: 'Invalid email' });
		}
		await Newsletter.updateOne(
			{ email: normalized },
			{ $setOnInsert: { email: normalized, source: source || 'web' } },
			{ upsert: true }
		);
		return res.json({ ok: true });
	} catch (err) {
		if (err && err.code === 11000) return res.json({ ok: true });
		return res.status(500).json({ error: 'Failed to subscribe' });
	}
});

module.exports = router; 