import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function CheckoutPage() {
	const [email, setEmail] = useState("");
	const [provider, setProvider] = useState("paystack");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [cartItems, setCartItems] = useState([]);
	const [total, setTotal] = useState(0);

	// Load cart items on component mount
	useEffect(() => {
		try {
			const items = JSON.parse(localStorage.getItem('kex_cart') || '[]');
			setCartItems(items);
			const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
			setTotal(totalAmount);
		} catch (e) {
			console.error('Error loading cart:', e);
		}
	}, []);

	async function startCheckout(e) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			// Get cart items from localStorage
			const cartItems = JSON.parse(localStorage.getItem('kex_cart') || '[]');
			if (cartItems.length === 0) {
				setError('Your cart is empty');
				return;
			}

			// Transform cart items to the format expected by the API
			const items = cartItems.map(item => ({
				name: item.name,
				price: item.price * 100, // Convert to kobo (smallest currency unit)
				quantity: item.qty || 1,
				image: item.img || null
			}));

			const res = await fetch(`${API_BASE}/api/orders/init`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items, customerEmail: email, currency: 'NGN', provider })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || 'init_failed');
			if (data.authorizationUrl) {
				window.location.href = data.authorizationUrl;
			}
		} catch (e) {
			setError('Failed to start checkout');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<button 
							onClick={() => window.location.href = '/'}
							className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
							</svg>
							<span>Back to Store</span>
						</button>
						<div className="flex items-center">
							<div className="gradient-bg text-white px-3 py-1 rounded-lg font-bold text-lg">KEX</div>
							<span className="ml-2 text-gray-800 font-semibold">Checkout</span>
						</div>
					</div>
				</div>
			</header>
			
			<div className="mx-auto max-w-4xl px-4 py-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Cart Summary */}
					<div className="bg-white rounded-lg shadow-md p-6">
						<h2 className="text-xl font-semibold mb-4">Order Summary</h2>
						{cartItems.length === 0 ? (
							<p className="text-gray-500">Your cart is empty</p>
						) : (
							<div className="space-y-4">
								{cartItems.map((item, index) => (
									<div key={index} className="flex items-center space-x-4 border-b pb-4">
										{item.img && (
											<img src={item.img} alt={item.name} className="w-16 h-16 object-cover rounded" />
										)}
										<div className="flex-1">
											<h3 className="font-medium">{item.name}</h3>
											<p className="text-sm text-gray-600">Qty: {item.qty || 1}</p>
										</div>
										<div className="text-right">
											<p className="font-semibold">₦{(item.price * (item.qty || 1)).toLocaleString()}</p>
										</div>
									</div>
								))}
								<div className="border-t pt-4">
									<div className="flex justify-between items-center mb-4">
										<span className="text-lg font-semibold">Total:</span>
										<span className="text-2xl font-bold text-purple-600">₦{total.toLocaleString()}</span>
									</div>
									<button 
										type="button"
										onClick={() => {
											localStorage.removeItem('kex_cart');
											setCartItems([]);
											setTotal(0);
										}}
										className="w-full text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition"
									>
										Clear Cart
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Checkout Form */}
					<div className="bg-white rounded-lg shadow-md p-6">
						<h1 className="text-2xl font-semibold mb-2">Checkout</h1>
						<p className="text-sm text-gray-600 mb-6">Enter your email and choose a payment provider.</p>
						
						{cartItems.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-500 mb-4">Your cart is empty</p>
								<button 
									onClick={() => window.history.back()} 
									className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
								>
									Continue Shopping
								</button>
							</div>
						) : (
							<form onSubmit={startCheckout} className="space-y-4">
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
									<input 
										id="email"
										name="email"
										type="email" 
										required 
										className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
										placeholder="your@email.com" 
										value={email} 
										onChange={(e)=>setEmail(e.target.value)} 
									/>
								</div>
								<div>
									<label htmlFor="payment-provider" className="block text-sm font-medium text-gray-700 mb-1">Payment Provider</label>
									<select 
										id="payment-provider"
										name="payment-provider"
										value={provider} 
										onChange={(e)=>setProvider(e.target.value)} 
										className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									>
										<option value="paystack">Paystack</option>
										<option value="flutterwave">Flutterwave</option>
									</select>
								</div>
								<button 
									disabled={loading} 
									className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
								>
									{loading ? 'Processing...' : `Pay ₦${total.toLocaleString()}`}
								</button>
							</form>
						)}
						{error && <div className="mt-3 text-sm text-red-600">{error}</div>}
					</div>
				</div>
			</div>
		</div>
	);
} 