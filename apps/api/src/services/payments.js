const axios = require('axios');

function makeRef(prefix = 'kex') {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString().slice(-6)}`;
}

async function initPaystack({ amount, email, reference, callback_url }) {
	const res = await axios.post(
		'https://api.paystack.co/transaction/initialize',
		{ amount: Math.round(amount * 100), email, reference, callback_url },
		{ headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
	);
	return res.data;
}

async function verifyPaystack(reference) {
	const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
		headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
	});
	return res.data;
}

async function initFlutterwave({ amount, email, currency, reference, redirect_url }) {
	const res = await axios.post(
		'https://api.flutterwave.com/v3/payments',
		{
			amount,
			currency: currency || 'NGN',
			tx_ref: reference,
			customer: { email },
			redirect_url,
		},
		{ headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
	);
	return res.data;
}

async function verifyFlutterwave(reference) {
	const res = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
		headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
	});
	return res.data;
}

module.exports = {
	makeRef,
	initPaystack,
	verifyPaystack,
	initFlutterwave,
	verifyFlutterwave,
}; 