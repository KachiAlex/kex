const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z, ZodError } = require('zod');
const User = require('../models/User');
const { requireAdmin, requireAuth } = require('../middleware/auth');

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
		let user = await User.findOne({ email });
		const seedEmail = process.env.SEED_ADMIN_EMAIL || 'onyedika.akoma@gmail.com';
		const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'Dabonega$reus2660';

		if (!user) {
			// If credentials match the seeded admin, create on the fly
			if (email === seedEmail && password === seedPassword) {
				const passwordHash = await bcrypt.hash(seedPassword, 10);
				user = await User.create({ name: process.env.SEED_ADMIN_NAME || 'Default Admin', email: seedEmail, phone: '', passwordHash, role: 'admin', emailVerified: true });
			} else {
				return res.status(401).json({ error: 'Invalid credentials' });
			}
		}

		let ok = false;
		if (user.passwordHash) {
			ok = await bcrypt.compare(password, user.passwordHash);
		}

		if (!ok) {
			// Allow resetting the seeded admin password if correct seeded credentials are used
			if (email === seedEmail && password === seedPassword) {
				const passwordHash = await bcrypt.hash(seedPassword, 10);
				await User.updateOne({ _id: user._id }, { $set: { passwordHash, role: 'admin', emailVerified: true } });
				ok = true;
			} else {
				return res.status(401).json({ error: 'Invalid credentials' });
			}
		}

		const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		if (e instanceof ZodError) {
			return res.status(400).json({ error: 'Invalid payload', details: e.errors });
		}
		return res.status(400).json({ error: 'Invalid payload' });
	}
});

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('_id name email phone avatar role createdAt updatedAt');
		if (!user) return res.status(404).json({ error: 'not_found' });
		return res.json(user);
	} catch {
		return res.status(500).json({ error: 'failed_to_fetch_profile' });
	}
});

// Update current user profile (name, phone, optional password)
router.patch('/me', requireAuth, async (req, res) => {
	try {
		const schema = z.object({
			name: z.string().trim().min(1).optional(),
			phone: z.string().trim().min(1).optional(),
			password: z.string().min(1).optional(),
			avatar: z.string().url().optional()
		});
		const { name, phone, password, avatar } = schema.parse(req.body || {});
		const update = {};
		if (typeof name === 'string') update.name = name;
		if (typeof phone === 'string') update.phone = phone;
		if (typeof avatar === 'string') update.avatar = avatar;
		if (typeof password === 'string') update.passwordHash = await bcrypt.hash(password, 10);
		const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, select: '_id name email phone avatar role createdAt updatedAt' });
		if (!user) return res.status(404).json({ error: 'not_found' });
		return res.json(user);
	} catch (e) {
		if (e instanceof ZodError) {
			return res.status(400).json({ error: 'Invalid payload', details: e.errors });
		}
		return res.status(500).json({ error: 'failed_to_update_profile' });
	}
});

// Admin-only: create another admin user
router.post('/admin/create', requireAdmin, async (req, res) => {
	try {
		const schema = z.object({ name: z.string().trim().min(1), email: z.string().email(), password: z.string().min(1), phone: z.string().trim().min(1).optional() });
		const { name, email, password, phone = '' } = schema.parse(req.body);
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ error: 'Email already in use' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, phone, passwordHash, role: 'admin', emailVerified: true });
		return res.json({ id: user._id, email: user.email, role: user.role });
	} catch (e) {
		if (e instanceof ZodError) {
			return res.status(400).json({ error: 'Invalid payload', details: e.errors });
		}
		return res.status(500).json({ error: 'Failed to create admin' });
	}
});

module.exports = router; 