const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
	const auth = req.headers.authorization || '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
		req.user = payload;
		return next();
	} catch {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

function requireAdmin(req, res, next) {
	if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
	return next();
}

module.exports = { requireAuth, requireAdmin }; 