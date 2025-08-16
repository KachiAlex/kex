const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { z } = require('zod');
const User = require('../models/User');

const router = express.Router();

const signupSchema = z.object({ name: z.string().optional(), email: z.string().email(), password: z.string().min(6) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/signup', async (req, res) => {
	try {
		const { name = '', email, password } = signupSchema.parse(req.body);
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ error: 'Email already in use' });
		const passwordHash = await bcrypt.hash(password, 10);
		const role = email.endsWith('@kex.local') ? 'admin' : 'customer';
		const user = await User.create({ name, email, passwordHash, role });
		const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		return res.status(400).json({ error: 'Invalid payload' });
	}
});

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
		return res.status(400).json({ error: 'Invalid payload' });
	}
});

// --- Google OAuth 2.0 ---
function getServerBaseUrl() {
	return process.env.SERVER_BASE_URL || process.env.RENDER_EXTERNAL_URL || '';
}

router.get('/google', (req, res) => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const redirectUri = `${getServerBaseUrl()}/api/auth/google/callback`;
	const scope = encodeURIComponent('openid email profile');
	const state = encodeURIComponent(req.query.state || 'login');
	if (!clientId || !redirectUri) return res.status(500).send('Google OAuth not configured');
	const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
	return res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
	try {
		const code = req.query.code;
		if (!code) return res.status(400).send('Missing code');
		const clientId = process.env.GOOGLE_CLIENT_ID;
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
		const redirectUri = `${getServerBaseUrl()}/api/auth/google/callback`;
		const clientBase = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
		if (!clientId || !clientSecret || !redirectUri) return res.status(500).send('Google OAuth not configured');

		// Exchange code for tokens
		const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code'
		}).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

		const accessToken = tokenRes.data?.access_token;
		if (!accessToken) return res.status(401).send('Token exchange failed');

		// Fetch userinfo
		const infoRes = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
		const { email, name } = infoRes.data || {};
		if (!email) return res.status(400).send('No email from Google');

		// Find or create user
		let user = await User.findOne({ email });
		if (!user) {
			user = await User.create({ name: name || '', email, passwordHash: '', role: email.endsWith('@kex.local') ? 'admin' : 'customer' });
		}

		const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		const redirect = `${clientBase}/admin?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`;
		return res.redirect(redirect);
	} catch (e) {
		return res.status(500).send('Google auth failed');
	}
});

module.exports = router; 