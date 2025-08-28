import { useState } from "react";

export default function Footer({ onSubscribe }) {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState("");
	const [toast, setToast] = useState("");

	async function handleSubscribe(e) {
		e?.preventDefault?.();
		setStatus("");
		const trimmed = email.trim();
		if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
			setStatus("Please enter a valid email.");
			return;
		}
		try {
			if (onSubscribe) {
				await onSubscribe(trimmed);
			} else {
				const list = JSON.parse(localStorage.getItem("kex_newsletter") || "[]");
				if (!list.includes(trimmed)) localStorage.setItem("kex_newsletter", JSON.stringify([...list, trimmed]));
			}
			setToast("Subscribed to newsletter");
			setStatus("Subscribed! Check your inbox.");
			setEmail("");
			setTimeout(() => setStatus(""), 3000);
			setTimeout(() => setToast(""), 1600);
		} catch (err) {
			setToast("Subscription failed");
			setStatus("Subscription failed. Try again.");
			setTimeout(() => setToast(""), 1600);
		}
	}

	return (
		<footer className="bg-gray-900 text-white">
			{toast && (
				<div className="fixed bottom-6 right-6 bg-black/80 text-white text-sm px-4 py-2 rounded shadow-lg z-50">
					{toast}
				</div>
			)}
			<div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center space-y-4">
						<h3 className="text-2xl font-bold">Stay Updated</h3>
						<p className="text-blue-100 max-w-md mx-auto">
							Subscribe to our newsletter and get 10% off your first order
						</p>
						<form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
							<input
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
							/>
							<button type="submit" className="bg-white text-blue-600 hover:bg-gray-100 px-5 py-3 rounded-lg font-semibold">Subscribe</button>
						</form>
						{status && <div className="text-sm text-white/90">{status}</div>}
					</div>
				</div>
			</div>

			<div className="py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								<div className="gradient-bg text-white px-3 py-2 rounded-lg font-bold text-lg glow-effect float-animation">KEX</div>
								<span className="text-xl font-bold">KexCommerce</span>
							</div>
							<p className="text-gray-400 text-sm leading-relaxed">
								Your trusted partner for premium products. We deliver quality, innovation, and exceptional customer service.
							</p>
							<div className="flex space-x-3">
								<button className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg" aria-label="Facebook">
									<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06c0 5.01 3.66 9.16 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34v7.03C18.34 21.22 22 17.07 22 12.06z"/></svg>
								</button>
								<button className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg" aria-label="Twitter">
									<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.55-1.37 1.87-2.37-.82.49-1.72.84-2.68 1.03A4.14 4.14 0 0015.5 4c-2.3 0-4.16 1.86-4.16 4.16 0 .33.04.65.11.95C7.55 9 4.29 7.38 2.05 4.9c-.36.62-.56 1.35-.56 2.12 0 1.46.74 2.75 1.86 3.51-.69-.02-1.34-.21-1.9-.53v.05c0 2.04 1.45 3.75 3.36 4.14-.35.1-.72.15-1.1.15-.27 0-.53-.03-.78-.07.53 1.66 2.07 2.87 3.9 2.9A8.31 8.31 0 012 19.54 11.74 11.74 0 008.29 21c7.55 0 11.68-6.25 11.68-11.68v-.53c.8-.58 1.5-1.3 2.05-2.12z"/></svg>
								</button>
								<button className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg" aria-label="Instagram">
									<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10zm-5 3.8a5.2 5.2 0 100 10.4 5.2 5.2 0 000-10.4zm0 2a3.2 3.2 0 110 6.4 3.2 3.2 0 010-6.4zM17.5 6.5a1 1 0 100 2 1 1 0 000-2z"/></svg>
								</button>
								<button className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg" aria-label="YouTube">
									<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 00.5 6.2 31.9 31.9 0 000 12a31.9 31.9 0 00.5 5.8 3 3 0 002.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 002.1-2.1A31.9 31.9 0 0024 12a31.9 31.9 0 00-.5-5.8zM9.6 15.3V8.7l6.2 3.3-6.2 3.3z"/></svg>
								</button>
							</div>
						</div>

						<div className="space-y-4">
							<h4 className="font-semibold text-lg">Quick Links</h4>
							<nav className="flex flex-col space-y-2">
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</a>
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Products</a>
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Categories</a>
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Deals</a>
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Blog</a>
							</nav>
						</div>

						<div className="space-y-4">
							<h4 className="font-semibold text-lg">Customer Service</h4>
							<nav className="flex flex-col space-y-2">
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Us</a>
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">FAQ</a>
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Shipping Info</a>
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Returns</a>
								<a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Size Guide</a>
							</nav>
						</div>

						<div className="space-y-4">
							<h4 className="font-semibold text-lg">Contact Info</h4>
							<div className="space-y-3">
								<div className="flex items-center space-x-3 text-sm">
									<svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
									<span className="text-gray-400">123 Commerce St, City, State 12345</span>
								</div>
								<div className="flex items-center space-x-3 text-sm">
									<svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.05-.24c1.14.38 2.37.59 3.54.59a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h2.47a1 1 0 011 1c0 1.17.2 2.4.59 3.54a1 1 0 01-.24 1.05l-2.2 2.2z"/></svg>
									<span className="text-gray-400">+1 (555) 123-4567</span>
								</div>
								<div className="flex items-center space-x-3 text-sm">
									<svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1.4 3L12 12.25 5.4 7h13.2z"/></svg>
									<span className="text-gray-400">support@kexcommerce.com</span>
								</div>
							</div>
							<div className="text-sm text-gray-400">
								<p>Mon - Fri: 9:00 AM - 6:00 PM</p>
								<p>Sat - Sun: 10:00 AM - 4:00 PM</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="h-px bg-gray-800" />
			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
						<div className="text-sm text-gray-400">
							© {new Date().getFullYear()} KexCommerce. All rights reserved.
						</div>
						<div className="flex space-x-6 text-sm text-gray-400">
							<a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
							<a href="#" className="hover:text-white transition-colors">Terms of Service</a>
							<a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
} 