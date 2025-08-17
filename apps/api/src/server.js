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

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kex';

async function start() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('Connected to MongoDB');
		app.listen(PORT, () => console.log(`API listening on :${PORT}`));
	} catch (err) {
		console.error('Failed to start server', err);
		process.exit(1);
	}
}

start(); 