const express = require('express');
const { z } = require('zod');
const Product = require('../models/Product');

const router = express.Router();

const { requireAuth, requireAdmin } = require('../middleware/auth');

// validation schema
const dataUrlOrUrl = z.string().refine((v)=>{
	if (!v) return false;
	if (v.startsWith('data:')) return true;
	try { new URL(v); return true; } catch { return false; }
}, { message: 'invalid_url' });

const productSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional().default(''),
	price: z.number().nonnegative(),
	quantity: z.number().int().nonnegative(),
	category: z.string().optional().default('general'),
	images: z.array(dataUrlOrUrl).optional().default([]),
	videos: z.array(dataUrlOrUrl).optional().default([]),
	featured: z.boolean().optional().default(false),
});

function generatePlaceholderProducts() {
	return [
		{ _id: 'placeholder-sw-1', name: 'KEX Smartwatch X1', price: 149.0, quantity: 25, featured: true, category: 'smartwatch', images: ['https://images.unsplash.com/photo-1518441902110-2370cdd502db?q=80&w=800&auto=format&fit=crop'], description: 'Premium smartwatch with health tracking.' },
		{ _id: 'placeholder-lt-1', name: 'Aura Ambient Light', price: 39.0, quantity: 100, featured: true, category: 'lights', images: ['https://images.unsplash.com/photo-1510951363682-1b5e8694c3e0?q=80&w=800&auto=format&fit=crop'], description: 'Soothing RGB ambient light.' },
		{ _id: 'placeholder-gd-1', name: 'Smart Home Hub Mini', price: 89.0, quantity: 40, featured: true, category: 'gadgets', images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop'], description: 'Control your smart devices with ease.' },
		{ _id: 'placeholder-sp-1', name: 'Stealth Cam Glasses', price: 129.0, quantity: 15, featured: true, category: 'spy', images: ['https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=800&auto=format&fit=crop'], description: 'Discrete camera glasses.' },
		{ _id: 'placeholder-gf-1', name: 'KEX Gift Card $50', price: 50.0, quantity: 999, featured: true, category: 'gifts', images: ['https://images.unsplash.com/photo-1603566234499-76f301cb3318?q=80&w=800&auto=format&fit=crop'], description: 'Gift the KEX experience.' },
	];
}

// list products with optional filters
router.get('/', async (req, res) => {
	try {
		const { q, featured, sort } = req.query;
		const filter = {};
		if (q) {
			filter.name = { $regex: q, $options: 'i' };
		}
		if (featured === 'true') filter.featured = true;
		let query = Product.find(filter);
		if (sort === 'price_asc') query = query.sort({ price: 1 });
		if (sort === 'price_desc') query = query.sort({ price: -1 });
		const items = await query.exec();
		return res.json(items);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to list products' });
	}
});

router.get('/featured', async (_req, res) => {
	try {
		const items = await Product.find({ featured: true }).limit(12).exec();
		if (!items || items.length === 0) {
			return res.json(generatePlaceholderProducts());
		}
		return res.json(items);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to list featured products' });
	}
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
	try {
		const parsed = productSchema.parse(req.body);
		const created = await Product.create(parsed);
		return res.status(201).json(created);
	} catch (e) {
		if (e?.issues) return res.status(400).json({ error: 'Invalid payload', details: e.issues });
		return res.status(500).json({ error: 'Failed to create product' });
	}
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
	try {
		const partialSchema = productSchema.partial();
		const parsed = partialSchema.parse(req.body);
		const updated = await Product.findByIdAndUpdate(req.params.id, parsed, { new: true });
		return res.json(updated);
	} catch (e) {
		if (e?.issues) return res.status(400).json({ error: 'Invalid payload', details: e.issues });
		return res.status(500).json({ error: 'Failed to update product' });
	}
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
	try {
		await Product.findByIdAndDelete(req.params.id);
		return res.status(204).end();
	} catch (e) {
		return res.status(500).json({ error: 'Failed to delete product' });
	}
});

module.exports = router; 