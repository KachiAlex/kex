const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(helmet());

function normalizeOrigin(value) {
	if (!value) return '';
	return String(value).trim().replace(/\/$/, '');
}

const envOrigins = (process.env.CORS_ORIGIN || '').split(',').map(v => normalizeOrigin(v)).filter(Boolean);
const defaultOrigins = [
	'http://localhost:5173',
	'https://kexecommerce.netlify.app'
];
const allowlist = Array.from(new Set([...defaultOrigins.map(normalizeOrigin), ...envOrigins]));

app.use(cors({
	origin: (origin, callback) => {
		if (!origin) return callback(null, true); // allow curl/postman
		const normalized = normalizeOrigin(origin);
		if (allowlist.includes(normalized)) return callback(null, true);
		return callback(new Error('Not allowed by CORS'));
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(limiter);

app.get('/health', (_req, res) => {
	return res.json({ status: 'ok', service: 'kex-api' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/newsletter', require('./routes/newsletter'));

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kex';

async function seedAdmin() {
	const bcrypt = require('bcrypt');
	const User = require('./models/User');
	const email = process.env.SEED_ADMIN_EMAIL || 'onyedika.akoma@gmail.com';
	const password = process.env.SEED_ADMIN_PASSWORD || 'Dabonega$reus2660';
	const name = process.env.SEED_ADMIN_NAME || 'Default Admin';
	const existing = await User.findOne({ email });
	if (existing) return;
	const passwordHash = await bcrypt.hash(password, 10);
	await User.create({ name, email, phone: '', passwordHash, role: 'admin', emailVerified: true });
	console.log('Seeded default admin:', email);
}

async function start() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('Connected to MongoDB');
		await seedAdmin();
		app.listen(PORT, () => console.log(`API listening on :${PORT}`));
	} catch (err) {
		console.error('Failed to start server', err);
		process.exit(1);
	}
}

start(); 