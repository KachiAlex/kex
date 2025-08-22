const axios = require('axios');

function makeRef(prefix = 'kex') {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString().slice(-6)}`;
}

async function initPaystack({ amount, email, reference, callback_url }) {
	// amount should already be in kobo (smallest currency unit)
	const res = await axios.post(
		'https://api.paystack.co/transaction/initialize',
		{ amount, email, reference, callback_url },
		{ headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
	);
	return res.data;
}

async function verifyPaystack(reference) {
	console.log('Paystack verification: Verifying reference:', reference);
	try {
		const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
			headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
		});
		console.log('Paystack verification: Response status:', res.status);
		console.log('Paystack verification: Response data:', res.data);
		return res.data;
	} catch (error) {
		console.error('Paystack verification error:', error.response?.data || error.message);
		throw error;
	}
}

async function initFlutterwave({ amount, email, currency, reference, redirect_url, customerName, customerPhone }) {
	const res = await axios.post(
		'https://api.flutterwave.com/v3/payments',
		{
			amount,
			currency: currency || 'NGN',
			tx_ref: reference,
			customer: { 
				email,
				name: customerName || email.split('@')[0] || 'Customer',
				phone_number: customerPhone || 'N/A'
			},
			redirect_url,
			payment_options: 'card,banktransfer,ussd,barter,payattitude,mpesa,mobilemoneyghana,account,all',
			customizations: {
				title: 'KEX eCommerce',
				description: 'Complete your purchase',
				logo: 'https://your-logo-url.com/logo.png'
			},
			meta: {
				consumer_id: 23,
				consumer_mac: '92a3-912ba-1192a'
			}
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