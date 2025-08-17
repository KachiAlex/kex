const express = require('express');

const router = express.Router();

// Placeholder: return empty list for now
router.get('/', async (req, res) => {
	try {
		const { email } = req.query;
		return res.json([]);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch notifications' });
	}
});

module.exports = router; 