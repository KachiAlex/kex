const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
	try {
		const auth = req.headers.authorization || '';
		const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
		if (!token) return res.status(401).json({ error: 'unauthorized' });
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
		req.user = decoded;
		return next();
	} catch (e) {
		return res.status(401).json({ error: 'unauthorized' });
	}
}

function requireAdmin(req, res, next) {
	requireAuth(req, res, (err) => {
		if (err) return; // response already sent
		if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
		return next();
	});
}

module.exports = { requireAuth, requireAdmin }; 