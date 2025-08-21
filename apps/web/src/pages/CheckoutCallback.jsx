import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function CheckoutCallbackPage() {
	const [params] = useSearchParams();
	const [status, setStatus] = useState("verifying");
	const ref = params.get("ref");

	useEffect(() => {
		(async () => {
			try {
				if (!ref) { setStatus("missing"); return; }
				const res = await fetch(`${API_BASE}/api/orders/verify/${encodeURIComponent(ref)}`);
				const data = await res.json();
				if (data?.paid) {
					setStatus("paid");
					// Clear cart after successful payment
					localStorage.removeItem('kex_cart');
				} else {
					setStatus("failed");
				}
			} catch {
				setStatus("failed");
			}
		})();
	}, [ref]);

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
							<span className="ml-2 text-gray-800 font-semibold">Payment Status</span>
						</div>
					</div>
				</div>
			</header>
			
			<div className="grid place-items-center px-4 py-8">
			<div className="max-w-md text-center bg-white rounded-lg shadow-md p-8">
				{status === "verifying" && (
					<>
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
						<h1 className="text-2xl font-semibold mb-2">Verifying payment…</h1>
						<p className="text-gray-600">Please wait while we confirm your payment.</p>
					</>
				)}
				{status === "paid" && (
					<>
						<div className="text-green-500 text-6xl mb-4">✓</div>
						<h1 className="text-2xl font-semibold text-green-600 mb-2">Payment Successful!</h1>
						<p className="text-gray-600 mb-6">Thank you for your purchase. You will receive a confirmation email shortly.</p>
						<button 
							onClick={() => window.location.href = '/'}
							className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
						>
							Continue Shopping
						</button>
					</>
				)}
				{status === "failed" && (
					<>
						<div className="text-red-500 text-6xl mb-4">✗</div>
						<h1 className="text-2xl font-semibold text-red-600 mb-2">Payment Failed</h1>
						<p className="text-gray-600 mb-6">Something went wrong with your payment. Please try again.</p>
						<button 
							onClick={() => window.location.href = '/checkout'}
							className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
						>
							Try Again
						</button>
					</>
				)}
				{status === "missing" && (
					<>
						<div className="text-yellow-500 text-6xl mb-4">⚠</div>
						<h1 className="text-2xl font-semibold text-yellow-600 mb-2">Missing Reference</h1>
						<p className="text-gray-600 mb-6">Payment reference not found. Please contact support if you believe this is an error.</p>
						<button 
							onClick={() => window.location.href = '/'}
							className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
						>
							Go Home
						</button>
					</>
				)}
				<p className="mt-4 text-sm text-gray-500">Ref: {ref || "-"}</p>
			</div>
		</div>
		</div>
	);
} 