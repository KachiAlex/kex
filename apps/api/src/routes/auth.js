const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z, ZodError } = require('zod');
const User = require('../models/User');

const router = express.Router();

const signupSchema = z.object({
	name: z.string().trim().min(1),
	email: z.string().trim().email(),
	password: z.string().min(1),
	phone: z.string().trim().min(1)
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
// OTP schema no longer used

router.post('/signup', async (req, res) => {
	try {
		const { name, email, password, phone } = signupSchema.parse(req.body);
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ error: 'Email already in use' });
		const passwordHash = await bcrypt.hash(password, 10);
		const role = email.endsWith('@kex.local') ? 'admin' : 'customer';
		const user = await User.create({ name, email, phone, passwordHash, role, emailVerified: true, emailOtp: null, emailOtpExpiresAt: null });
		const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		if (e instanceof ZodError) {
			return res.status(400).json({ error: 'Invalid payload', details: e.errors });
		}
		return res.status(400).json({ error: 'Invalid payload' });
	}
});

// Removed /verify endpoint

router.post('/login', async (req, res) => {
	try {
		const { email, password } = loginSchema.parse(req.body);
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
		const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		if (e instanceof ZodError) {
			return res.status(400).json({ error: 'Invalid payload', details: e.errors });
		}
		return res.status(400).json({ error: 'Invalid payload' });
	}
});

module.exports = router; 