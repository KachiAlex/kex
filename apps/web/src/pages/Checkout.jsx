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
		loadCartItems();
	}, []);

	function loadCartItems() {
		try {
			const items = JSON.parse(localStorage.getItem('kex_cart') || '[]');
			setCartItems(items);
			const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
			setTotal(totalAmount);
		} catch (e) {
			console.error('Error loading cart:', e);
		}
	}

	// Function to remove item from cart
	function removeFromCart(itemId) {
		try {
			const updatedCart = cartItems.filter(item => item.id !== itemId);
			localStorage.setItem('kex_cart', JSON.stringify(updatedCart));
			setCartItems(updatedCart);
			const totalAmount = updatedCart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
			setTotal(totalAmount);
		} catch (e) {
			console.error('Error removing item:', e);
		}
	}

	// Function to update item quantity
	function updateQuantity(itemId, newQty) {
		if (newQty < 1) return;
		
		try {
			const updatedCart = cartItems.map(item => 
				item.id === itemId ? { ...item, qty: newQty } : item
			);
			localStorage.setItem('kex_cart', JSON.stringify(updatedCart));
			setCartItems(updatedCart);
			const totalAmount = updatedCart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
			setTotal(totalAmount);
		} catch (e) {
			console.error('Error updating quantity:', e);
		}
	}

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

			// Debug: Log cart items before transformation
			console.log('Cart items before transformation:', cartItems);

			// Transform cart items to the format expected by the API
			const items = cartItems.map(item => ({
				name: item.name,
				price: item.price, // Send original price, backend will convert to kobo
				quantity: item.qty || 1,
				image: item.img || null
			}));

			// Debug: Log transformed items
			console.log('Transformed items for API:', items);
			console.log('Total amount being sent:', items.reduce((sum, item) => sum + (item.price * item.quantity), 0));

			const requestBody = { items, customerEmail: email, currency: 'NGN', provider };
			console.log('Full request body:', requestBody);

			const res = await fetch(`${API_BASE}/api/orders/init`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody)
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || 'init_failed');
			if (data.authorizationUrl) {
				window.location.href = data.authorizationUrl;
			}
		} catch (e) {
			console.error('Checkout error:', e);
			setError('Failed to start checkout');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
			{/* Header */}
			<header className="bg-white shadow-lg border-b sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<button 
							onClick={() => window.location.href = '/'}
							className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 group"
						>
							<svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
							</svg>
							<span className="font-medium">Back to Store</span>
						</button>
						<div className="flex items-center">
							<div className="gradient-bg text-white px-4 py-2 rounded-lg font-bold text-xl glow-effect pulse-animation">KEX</div>
							<span className="ml-2 text-gray-800 font-semibold">Shopping Cart</span>
						</div>
					</div>
				</div>
			</header>
			
			<div className="mx-auto max-w-7xl px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Cart Summary - Takes 2 columns on large screens */}
					<div className="lg:col-span-2">
						<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
							<div className="flex items-center justify-between mb-8">
								<h2 className="text-3xl font-bold text-gray-800 flex items-center">
									<svg className="w-8 h-8 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
									</svg>
									Your Cart ({cartItems.length} items)
								</h2>
								{cartItems.length > 0 && (
									<button 
										onClick={() => {
											localStorage.removeItem('kex_cart');
											setCartItems([]);
											setTotal(0);
										}}
										className="text-red-500 hover:text-red-700 font-medium flex items-center transition-colors duration-200"
									>
										<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
										Clear All
									</button>
								)}
							</div>

							{cartItems.length === 0 ? (
								<div className="text-center py-16">
									<div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
										<svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
										</svg>
									</div>
									<h3 className="text-2xl font-semibold text-gray-600 mb-2">Your cart is empty</h3>
									<p className="text-gray-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
									<button 
										onClick={() => window.location.href = '/'} 
										className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 animated-button"
									>
										Start Shopping
									</button>
								</div>
							) : (
								<div className="space-y-6">
									{cartItems.map((item, index) => (
										<div key={item.id} className={`bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 card-hover ${index % 2 === 0 ? 'slide-in-left' : 'slide-in-right'}`}>
											<div className="flex items-center space-x-6">
												{/* Product Image */}
												<div className="relative">
													{item.img ? (
														<img 
															src={item.img} 
															alt={item.name} 
															className="w-20 h-20 object-cover rounded-lg shadow-md" 
														/>
													) : (
														<div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-purple-400 rounded-lg flex items-center justify-center shadow-md">
															<span className="text-2xl">🛍️</span>
														</div>
													)}
													{/* Remove button */}
													<button
														onClick={() => removeFromCart(item.id)}
														className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
														title="Remove item"
													>
														<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
														</svg>
													</button>
												</div>

												{/* Product Details */}
												<div className="flex-1">
													<h3 className="font-semibold text-lg text-gray-800 mb-2">{item.name}</h3>
													<div className="flex items-center justify-between">
														<div className="flex items-center space-x-4">
															{/* Quantity Controls */}
															<div className="flex items-center space-x-2">
																<button
																	onClick={() => updateQuantity(item.id, (item.qty || 1) - 1)}
																	className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors duration-200"
																>
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
																	</svg>
																</button>
																<span className="w-12 text-center font-semibold text-gray-700">{item.qty || 1}</span>
																<button
																	onClick={() => updateQuantity(item.id, (item.qty || 1) + 1)}
																	className="w-8 h-8 bg-purple-200 hover:bg-purple-300 rounded-full flex items-center justify-center transition-colors duration-200"
																>
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
																	</svg>
																</button>
															</div>
															<span className="text-gray-500">×</span>
															<span className="text-xl font-bold text-purple-600">₦{Number(item.price).toLocaleString()}</span>
														</div>
														<div className="text-right">
															<p className="text-2xl font-bold text-gray-800">₦{(item.price * (item.qty || 1)).toLocaleString()}</p>
														</div>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Checkout Form - Takes 1 column on large screens */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 sticky top-24">
							<h1 className="text-2xl font-bold text-gray-800 mb-2">Checkout</h1>
							<p className="text-gray-600 mb-6">Complete your purchase securely</p>
							
							{/* Order Summary */}
							{cartItems.length > 0 && (
								<div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-purple-100">
									<h3 className="font-semibold text-gray-800 mb-4 flex items-center">
										<svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
										Order Summary
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between text-sm">
											<span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
											<span className="font-medium">₦{total.toLocaleString()}</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-gray-600">Shipping</span>
											<span className="text-green-600 font-medium">Free</span>
										</div>
										<div className="border-t pt-3">
											<div className="flex justify-between items-center">
												<span className="text-lg font-semibold text-gray-800">Total</span>
												<span className="text-2xl font-bold text-purple-600">₦{total.toLocaleString()}</span>
											</div>
										</div>
									</div>
								</div>
							)}

							{cartItems.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-500 mb-4">Add items to your cart to checkout</p>
									<button 
										onClick={() => window.location.href = '/'} 
										className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 animated-button"
									>
										Continue Shopping
									</button>
								</div>
							) : (
								<form onSubmit={startCheckout} className="space-y-6">
									<div>
										<label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
										<div className="relative">
											<svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
											</svg>
											<input 
												id="email"
												name="email"
												type="email" 
												required 
												className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200" 
												placeholder="your@email.com" 
												value={email} 
												onChange={(e)=>setEmail(e.target.value)} 
											/>
										</div>
									</div>
									<div>
										<label htmlFor="payment-provider" className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
										<div className="relative">
											<svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
											</svg>
											<select 
												id="payment-provider"
												name="payment-provider"
												value={provider} 
												onChange={(e)=>setProvider(e.target.value)} 
												className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 appearance-none bg-white"
											>
												<option value="paystack">Paystack (Recommended)</option>
												<option value="flutterwave">Flutterwave</option>
											</select>
										</div>
									</div>
									<button 
										disabled={loading} 
										className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 animated-button shadow-lg"
									>
										{loading ? (
											<div className="flex items-center justify-center">
												<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
												Processing...
											</div>
										) : (
											`Pay ₦${total.toLocaleString()}`
										)}
									</button>
									{error && (
										<div className="bg-red-50 border border-red-200 rounded-lg p-4">
											<div className="flex items-center">
												<svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<span className="text-sm text-red-600">{error}</span>
											</div>
										</div>
									)}
								</form>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 