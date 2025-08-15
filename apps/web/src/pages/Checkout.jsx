import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function CheckoutPage() {
	const [email, setEmail] = useState("");
	const [provider, setProvider] = useState("paystack");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function startCheckout(e) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const items = [
				{ name: "KEX Smartwatch X1", price: 149, quantity: 1, image: "https://images.unsplash.com/photo-1518441902110-2370cdd502db?q=80&w=800&auto=format&fit=crop" },
			];
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
		<div className="min-h-screen bg-white">
			<div className="mx-auto max-w-xl px-4 py-6">
				<h1 className="text-2xl font-semibold">Checkout</h1>
				<p className="text-sm text-gray-600">Enter your email and choose a payment provider.</p>
				<form onSubmit={startCheckout} className="mt-6 space-y-4">
					<input type="email" required className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
					<select value={provider} onChange={(e)=>setProvider(e.target.value)} className="w-full border rounded px-3 py-2">
						<option value="paystack">Paystack</option>
						<option value="flutterwave">Flutterwave</option>
					</select>
					<button disabled={loading} className="rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90 transition">Pay</button>
				</form>
				{error && <div className="mt-3 text-sm text-red-600">{error}</div>}
			</div>
		</div>
	);
} 