const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');
const Order = require('../models/Order');
const { makeRef, initPaystack, initFlutterwave, verifyPaystack, verifyFlutterwave } = require('../services/payments');
const { requireAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

const createOrderSchema = z.object({
	items: z.array(z.object({
		productId: z.string().optional(),
		name: z.string(),
		price: z.number().nonnegative(),
		quantity: z.number().int().positive(),
		image: z.string().url().optional(),
	})).min(1),
	currency: z.string().default('NGN'),
	customerEmail: z.string().email(),
	provider: z.enum(['paystack', 'flutterwave']),
});

router.post('/init', async (req, res) => {
	try {
		const parsed = createOrderSchema.parse(req.body);
		const amount = parsed.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
		const reference = makeRef('kex');
		const order = await Order.create({
			reference,
			items: parsed.items,
			amount,
			currency: parsed.currency,
			customerEmail: parsed.customerEmail,
			provider: parsed.provider,
			status: 'pending',
		});

		const redirectBase = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
		if (parsed.provider === 'paystack') {
			const init = await initPaystack({ amount, email: parsed.customerEmail, reference, callback_url: `${redirectBase}/checkout/callback?ref=${reference}` });
			await Order.updateOne({ _id: order._id }, { authorizationUrl: init?.data?.authorization_url, providerReference: init?.data?.reference });
			return res.json({ reference, authorizationUrl: init?.data?.authorization_url });
		}

		if (parsed.provider === 'flutterwave') {
			const init = await initFlutterwave({ amount, email: parsed.customerEmail, currency: parsed.currency, reference, redirect_url: `${redirectBase}/checkout/callback?ref=${reference}` });
			const link = init?.data?.link;
			await Order.updateOne({ _id: order._id }, { authorizationUrl: link, providerReference: reference });
			return res.json({ reference, authorizationUrl: link });
		}

		return res.status(400).json({ error: 'Unknown provider' });
	} catch (e) {
		return res.status(400).json({ error: 'Invalid request', details: e?.issues || e?.message });
	}
});

router.get('/verify/:reference', async (req, res) => {
	try {
		const { reference } = req.params;
		const order = await Order.findOne({ reference });
		if (!order) return res.status(404).json({ error: 'Order not found' });

		if (order.provider === 'paystack') {
			const v = await verifyPaystack(reference);
			const paid = v?.data?.status === 'success';
			if (paid) await Order.updateOne({ _id: order._id }, { status: 'paid' });
			return res.json({ paid });
		}

		if (order.provider === 'flutterwave') {
			const v = await verifyFlutterwave(reference);
			const paid = v?.data?.status === 'successful';
			if (paid) await Order.updateOne({ _id: order._id }, { status: 'paid', escrowStatus: 'held' });
			return res.json({ paid });
		}

		return res.status(400).json({ error: 'Unknown provider' });
	} catch (e) {
		return res.status(500).json({ error: 'Verification failed' });
	}
});

// Flutterwave webhook to confirm payments server-to-server
router.post('/webhooks/flutterwave', express.raw({ type: '*/*' }), async (req, res) => {
	try {
		const signature = req.headers['verif-hash'];
		const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLUTTERWAVE_SECRET_KEY;
		if (!secret || signature !== secret) return res.status(401).end();
		const payload = JSON.parse(req.body.toString('utf8'));
		const txRef = payload?.data?.tx_ref || payload?.tx_ref;
		const status = payload?.data?.status || payload?.status;
		if (!txRef) return res.status(200).end();
		const order = await Order.findOne({ reference: txRef });
		if (!order) return res.status(200).end();
		if (status === 'successful') {
			await Order.updateOne({ _id: order._id }, { status: 'paid', escrowStatus: 'held' });
		}
		return res.status(200).end();
	} catch {
		return res.status(200).end();
	}
});

// Admin releases escrow (settles to merchant)
router.post('/escrow/:reference/release', requireAuth, requireAdmin, async (req, res) => {
	try {
		const { reference } = req.params;
		const order = await Order.findOne({ reference });
		if (!order) return res.status(404).json({ error: 'not_found' });
		if (order.escrowStatus !== 'held') return res.status(400).json({ error: 'escrow_not_held' });
		await Order.updateOne({ _id: order._id }, { escrowStatus: 'released', escrowReleasedAt: new Date() });
		return res.json({ ok: true });
	} catch {
		return res.status(500).json({ error: 'failed_to_release' });
	}
});

// List orders (optionally filter by email)
router.get('/', async (req, res) => {
	try {
		const { email } = req.query;
		const query = email ? { customerEmail: email } : {};
		const orders = await Order.find(query).sort({ createdAt: -1 });
		return res.json(orders);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch orders' });
	}
});

// Basic analytics (optionally filter by email)
router.get('/stats', async (req, res) => {
	try {
		const { email } = req.query;
		const match = email ? { customerEmail: email } : {};
		const [summary] = await Order.aggregate([
			{ $match: match },
			{ $group: {
				_id: null,
				totalOrders: { $sum: 1 },
				paidOrders: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
				totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
			} }
		]);
		return res.json(summary || { totalOrders: 0, paidOrders: 0, totalRevenue: 0 });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch stats' });
	}
});

// Frequently purchased products (optionally filter by email)
router.get('/frequent', async (req, res) => {
	try {
		const { email, limit } = req.query;
		const lim = Math.max(1, Math.min(parseInt(limit || '5', 10) || 5, 20));
		const pipeline = [
			...(email ? [{ $match: { customerEmail: email } }] : []),
			{ $match: { status: 'paid' } },
			{ $unwind: '$items' },
			{ $group: {
				_id: { productId: '$items.productId', name: '$items.name' },
				totalQuantity: { $sum: '$items.quantity' },
				totalAmount: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
			} },
			{ $sort: { totalQuantity: -1 } },
			{ $limit: lim }
		];
		const results = await Order.aggregate(pipeline);
		return res.json(results.map(r => ({
			productId: r._id.productId || null,
			name: r._id.name,
			quantity: r.totalQuantity,
			amount: r.totalAmount
		})));
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch frequent products' });
	}
});

module.exports = router; 