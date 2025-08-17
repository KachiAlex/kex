const express = require('express');
const { z, ZodError } = require('zod');
const Category = require('../models/Category');
const { requireAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
	try {
		const list = await Category.find({}).sort({ name: 1 });
		return res.json(list);
	} catch {
		return res.status(500).json({ error: 'failed_to_list_categories' });
	}
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
	try {
		const schema = z.object({ name: z.string().trim().min(1) });
		const { name } = schema.parse(req.body);
		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
		const exists = await Category.findOne({ $or: [{ name }, { slug }] });
		if (exists) return res.status(409).json({ error: 'category_exists' });
		const created = await Category.create({ name, slug });
		return res.status(201).json(created);
	} catch (e) {
		if (e instanceof ZodError) return res.status(400).json({ error: 'invalid_payload', details: e.errors });
		return res.status(500).json({ error: 'failed_to_create_category' });
	}
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
	try {
		const schema = z.object({ name: z.string().trim().min(1).optional(), featured: z.boolean().optional() });
		const { name, featured } = schema.parse(req.body || {});
		const update = {};
		if (typeof name === 'string') {
			update.name = name;
			update.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
		}
		if (typeof featured === 'boolean') update.featured = featured;
		const updated = await Category.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
		return res.json(updated);
	} catch (e) {
		if (e instanceof ZodError) return res.status(400).json({ error: 'invalid_payload', details: e.errors });
		return res.status(500).json({ error: 'failed_to_update_category' });
	}
});

module.exports = router; 