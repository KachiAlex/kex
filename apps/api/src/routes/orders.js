const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');
const Order = require('../models/Order');
const { makeRef, initPaystack, initFlutterwave, verifyPaystack, verifyFlutterwave } = require('../services/payments');
const { requireAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
		
		// Debug: Log the raw request data
		console.log('Raw request body:', req.body);
		console.log('Parsed items:', parsed.items);
		
		const amount = parsed.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
		const reference = makeRef('kex');
		
		// Debug logging for amount conversion
		console.log('Order amount calculation:', {
			items: parsed.items,
			totalAmount: amount,
			amountInKobo: Math.round(amount * 100),
			amountInNaira: amount / 100
		});
		
		// Note: Prices can come in either naira or kobo format
		// - Default products: prices in naira (e.g., 8990 = ₦8,990)
		// - API products: may be in naira or kobo depending on the source
		// The Paystack conversion logic below handles both cases
		
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
			// Determine if amount is in kobo or naira based on the value
			let paystackAmount;
			const amountInNaira = amount / 100;
			
			if (amount >= 100000) {
				// If amount is 1000 naira or more, assume it's already in kobo
				console.log('Amount appears to be in kobo format (₦' + amountInNaira.toLocaleString() + ')');
				paystackAmount = Math.round(amount);
			} else if (amount >= 1000) {
				// If amount is between 10 naira and 1000 naira, it's likely in naira
				console.log('Amount appears to be in naira format (₦' + amount.toLocaleString() + '), converting to kobo');
				paystackAmount = Math.round(amount * 100);
			} else {
				// For small amounts, assume naira and convert to kobo
				console.log('Small amount detected, converting to kobo');
				paystackAmount = Math.round(amount * 100);
			}
			
			console.log('Paystack amount calculation:', { 
				originalAmount: amount, 
				amountInNaira: amountInNaira,
				finalKoboAmount: paystackAmount,
				expectedNairaDisplay: (paystackAmount / 100).toLocaleString()
			});
			
			const init = await initPaystack({ 
				amount: paystackAmount, 
				email: parsed.customerEmail, 
				reference, 
				callback_url: `${redirectBase}/checkout/callback?ref=${reference}` 
			});
			
			console.log('Paystack init response:', init);
			console.log('Our reference:', reference);
			console.log('Paystack reference:', init?.data?.reference);
			
			await Order.updateOne({ _id: order._id }, { 
				authorizationUrl: init?.data?.authorization_url, 
				providerReference: init?.data?.reference || reference 
			});
			return res.json({ reference, authorizationUrl: init?.data?.authorization_url });
		}

		if (parsed.provider === 'flutterwave') {
			try {
				// Flutterwave expects amount in original currency (not kobo)
				const init = await initFlutterwave({ 
					amount, 
					email: parsed.customerEmail, 
					currency: parsed.currency, 
					reference, 
					redirect_url: `${redirectBase}/checkout/callback?ref=${reference}` 
				});
				
				console.log('Flutterwave init response:', init); // Debug log
				
				const link = init?.data?.link;
				if (!link) {
					console.error('Flutterwave did not return a payment link:', init);
					return res.status(500).json({ error: 'Failed to initialize Flutterwave payment' });
				}
				
				await Order.updateOne({ _id: order._id }, { authorizationUrl: link, providerReference: reference });
				return res.json({ reference, authorizationUrl: link });
			} catch (error) {
				console.error('Flutterwave initialization error:', error.response?.data || error.message);
				return res.status(500).json({ 
					error: 'Flutterwave payment initialization failed',
					details: error.response?.data || error.message 
				});
			}
		}

		return res.status(400).json({ error: 'Unknown provider' });
	} catch (e) {
		return res.status(400).json({ error: 'Invalid request', details: e?.issues || e?.message });
	}
});

router.get('/verify/:reference', async (req, res) => {
	try {
		const { reference } = req.params;
		console.log('Verification request for reference:', reference);
		
		const order = await Order.findOne({ reference });
		console.log('Order found:', order ? 'Yes' : 'No');
		
		if (!order) {
			console.log('Order not found for reference:', reference);
			return res.status(404).json({ error: 'Order not found' });
		}

		console.log('Order details:', {
			reference: order.reference,
			provider: order.provider,
			status: order.status,
			amount: order.amount
		});

		if (order.provider === 'paystack') {
			console.log('Verifying Paystack payment...');
			
			// Try to verify with our reference first
			let v;
			try {
				v = await verifyPaystack(reference);
				console.log('Paystack verification with our reference successful:', v);
			} catch (error) {
				console.log('Paystack verification with our reference failed, trying provider reference...');
				// If that fails, try with the provider reference
				if (order.providerReference && order.providerReference !== reference) {
					try {
						v = await verifyPaystack(order.providerReference);
						console.log('Paystack verification with provider reference successful:', v);
					} catch (providerError) {
						console.error('Paystack verification with provider reference also failed:', providerError);
						throw error; // Throw the original error
					}
				} else {
					throw error;
				}
			}
			
			console.log('Paystack verification response:', v);
			const paid = v?.data?.status === 'success';
			if (paid) {
				console.log('Payment verified successfully, updating order status');
				await Order.updateOne({ _id: order._id }, { status: 'paid' });
			}
			return res.json({ paid });
		}

		if (order.provider === 'flutterwave') {
			console.log('Verifying Flutterwave payment...');
			const v = await verifyFlutterwave(reference);
			console.log('Flutterwave verification response:', v);
			const paid = v?.data?.status === 'successful';
			if (paid) {
				console.log('Payment verified successfully, updating order status');
				await Order.updateOne({ _id: order._id }, { status: 'paid', escrowStatus: 'held' });
			}
			return res.json({ paid });
		}

		console.log('Unknown provider:', order.provider);
		return res.status(400).json({ error: 'Unknown provider' });
	} catch (e) {
		console.error('Verification error:', e);
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