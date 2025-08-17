import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./index.css";

function Header({ cartCount, onSearch }) {
	const inputRef = useRef(null);
	return (
		<header className="bg-white shadow-lg sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center">
						<div className="gradient-bg text-white px-4 py-2 rounded-lg font-bold text-xl glow-effect pulse-animation">KEX</div>
						<span className="ml-2 text-gray-800 font-semibold">eCommerce</span>
					</div>
					<div className="flex-1 max-w-lg mx-8">
						<div className="relative">
							<input
								type="text"
								placeholder="Search for gadgets, phones, laptops..."
								className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								ref={inputRef}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										onSearch?.(e.currentTarget.value);
									}
								}}
							/>
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center">
								<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
						</div>
					</div>
					<nav className="hidden md:flex items-center space-x-8">
						<a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Home</a>
						<a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Categories</a>
						<a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Deals</a>
						<a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Support</a>
					</nav>
					<div className="flex items-center space-x-4">
						<button className="relative p-2 text-gray-700 hover:text-purple-600 float-animation" aria-label="Cart">
							<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
							</svg>
							<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pulse-animation">{cartCount}</span>
						</button>
						<a href="https://adminkexecommerce.netflix.app" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 animated-button">Admin</a>
					</div>
				</div>
			</div>
		</header>
	);
}

function HeroSlideshow() {
	const slides = useMemo(
		() => [
			{
				title: "Latest Smartphones",
				sub: "Discover cutting-edge mobile technology",
				cta: { label: "Shop Phones", color: "bg-purple-600 hover:bg-purple-700" },
				img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
			},
			{
				title: "Premium Laptops",
				sub: "High-performance computing for professionals",
				cta: { label: "Shop Laptops", color: "bg-blue-600 hover:bg-blue-700" },
				img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
			},
			{
				title: "Spy Gadgets",
				sub: "Advanced surveillance and security equipment",
				cta: { label: "Explore Gadgets", color: "bg-red-600 hover:bg-red-700" },
				img: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
			},
			{
				title: "Smart Watches",
				sub: "Stay connected with wearable technology",
				cta: { label: "Shop Watches", color: "bg-green-600 hover:bg-green-700" },
				img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
			},
			{
				title: "Tech Accessories",
				sub: "Complete your setup with premium accessories",
				cta: { label: "Shop Accessories", color: "bg-orange-600 hover:bg-orange-700" },
				img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
			}
		],
		[]
	);

	const [current, setCurrent] = useState(0);
	const total = slides.length;
	const intervalRef = useRef(0);

	useEffect(() => {
		intervalRef.current = window.setInterval(() => {
			setCurrent((c) => (c + 1) % total);
		}, 5000);
		return () => window.clearInterval(intervalRef.current);
	}, [total]);

	return (
		<section className="relative h-96 overflow-hidden">
			<div className="relative w-full h-full">
				{slides.map((s, i) => (
					<div
						key={s.title}
						className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
						style={{ background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${s.img}') center/cover no-repeat` }}
					>
						<div className="flex items-center justify-center h-full text-white text-center">
							<div>
								<h1 className="text-5xl font-bold mb-4">{s.title}</h1>
								<p className="text-xl mb-6">{s.sub}</p>
								<button className={`${s.cta.color} text-white px-8 py-3 rounded-lg font-semibold animated-button bounce-animation`}>
									{s.cta.label}
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
				{slides.map((_, i) => (
					<button key={i} className={`w-3 h-3 rounded-full bg-white ${i === current ? "opacity-100" : "opacity-50"}`} onClick={() => setCurrent(i)} aria-label={`Go to slide ${i + 1}`} />
				))}
			</div>

			<button
				className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
				aria-label="Previous slide"
				onClick={() => setCurrent((c) => (c - 1 + total) % total)}
			>
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
			</button>
			<button
				className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
				aria-label="Next slide"
				onClick={() => setCurrent((c) => (c + 1) % total)}
			>
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
			</button>
		</section>
	);
}

function Categories() {
	const items = [
		{ icon: "📱", title: "Phones & Accessories", sub: "Latest smartphones & cases", delay: "stagger-1" },
		{ icon: "💻", title: "Laptops & Accessories", sub: "High-performance computing", delay: "stagger-2" },
		{ icon: "🕵️", title: "Spy Gadgets", sub: "Surveillance & security", delay: "stagger-3" },
		{ icon: "⌚", title: "Smart Watches", sub: "Fitness & connectivity", delay: "stagger-4" }
	];
	return (
		<section className="py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Shop by Category</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
					{items.map((c) => (
						<div key={c.title} className={`category-card bg-white rounded-xl p-6 text-center shadow-lg cursor-pointer fade-in-up ${c.delay}`} onClick={() => alert(`Browsing ${c.title} - This would navigate to the category page!`)}>
							<div className="text-4xl mb-4 float-animation">{c.icon}</div>
							<h3 className="font-semibold text-gray-800">{c.title}</h3>
							<p className="text-sm text-gray-600 mt-2">{c.sub}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function FeaturedProducts({ onAddToCart }) {
	const products = [
		{ id: "p1", icon: "📱", name: "Premium Smartphone X1", desc: "Latest flagship with AI camera", price: "₦899,000", color: "from-blue-400 to-purple-500" },
		{ id: "p2", icon: "💻", name: "UltraBook Pro 15\"", desc: "High-performance laptop", price: "₦1,299,000", color: "from-gray-400 to-gray-600" },
		{ id: "p3", icon: "🕵️", name: "Mini Spy Camera", desc: "Discreet HD recording", price: "₦199,000", color: "from-red-400 to-pink-500" },
		{ id: "p4", icon: "⌚", name: "Smart Watch Elite", desc: "Health & fitness tracking", price: "₦349,000", color: "from-green-400 to-blue-500" }
	];
	return (
		<section className="py-16 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center mb-12">
					<h2 className="text-3xl font-bold text-gray-800">Featured Products</h2>
					<button className="text-purple-600 font-semibold hover:text-purple-700">View All →</button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{products.map((p, i) => (
						<div key={p.id} className={`card-hover bg-gray-50 rounded-xl overflow-hidden shadow-lg ${i < 2 ? "slide-in-left" : "slide-in-right"} stagger-${(i % 4) + 1}`}>
							<div className={`h-48 bg-gradient-to-br ${p.color} flex items-center justify-center`}>
								<div className={`${p.icon === "📱" ? "rotate-animation" : p.icon === "💻" ? "float-animation" : p.icon === "🕵️" ? "bounce-animation" : "pulse-animation"} text-6xl`}>{p.icon}</div>
							</div>
							<div className="p-6">
								<h3 className="font-semibold text-lg mb-2">{p.name}</h3>
								<p className="text-gray-600 text-sm mb-4">{p.desc}</p>
								<div className="flex justify-between items-center">
									<span className="text-2xl font-bold text-purple-600 pulse-animation">{p.price}</span>
									<button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 animated-button" onClick={() => onAddToCart?.(p.id)}>Add to Cart</button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function SpecialOffer() {
	return (
		<section className="py-16 bg-gray-100">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
					<h2 className="text-3xl font-bold mb-4">Special Launch Offer</h2>
					<p className="text-xl mb-6">Get 20% off on your first order + Free shipping across Nigeria</p>
					<button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 animated-button glow-effect pulse-animation">Claim Offer</button>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="bg-gray-800 text-white py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div>
						<div className="flex items-center mb-4">
							<div className="gradient-bg text-white px-3 py-2 rounded-lg font-bold text-lg glow-effect float-animation">KEX</div>
							<span className="ml-2 font-semibold fade-in-up">eCommerce</span>
						</div>
						<p className="text-gray-400">Your trusted source for premium tech gadgets and accessories.</p>
					</div>
					<div>
						<h3 className="font-semibold mb-4">Categories</h3>
						<ul className="space-y-2 text-gray-400">
							<li><a href="#" className="hover:text-white">Phones</a></li>
							<li><a href="#" className="hover:text-white">Laptops</a></li>
							<li><a href="#" className="hover:text-white">Spy Gadgets</a></li>
							<li><a href="#" className="hover:text-white">Watches</a></li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold mb-4">Support</h3>
						<ul className="space-y-2 text-gray-400">
							<li><a href="#" className="hover:text-white">Help Center</a></li>
							<li><a href="#" className="hover:text-white">Shipping Info</a></li>
							<li><a href="#" className="hover:text-white">Returns</a></li>
							<li><a href="#" className="hover:text-white">Contact Us</a></li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold mb-4">Contact Us</h3>
						<div className="space-y-3 text-gray-400">
							<div className="flex items-center"><span className="mr-2">📧</span><a href="mailto:info@kexecommerce.com" className="hover:text-white">info@kexecommerce.com</a></div>
							<div className="flex items-center"><span className="mr-2">📞</span><span>+234 803 123 4567</span></div>
							<div className="flex items-start"><span className="mr-2 mt-1">📍</span><span>17 Fisher St, Dopemu,<br/>Lagos, Nigeria</span></div>
							<div className="flex space-x-4 mt-4">
								<button className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600">📘</button>
								<button className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600">🐦</button>
								<button className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600">📷</button>
							</div>
						</div>
					</div>
				</div>
				<div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
					<p>© 2024 KEX eCommerce. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}

export default function App() {
	const [cartCount, setCartCount] = useState(3);

	return (
		<div className="bg-gray-50 min-h-screen">
			<Header cartCount={cartCount} onSearch={(term) => term && alert(`Searching for: ${term} - This would show search results!`)} />
			<HeroSlideshow />
			<Categories />
			<FeaturedProducts onAddToCart={() => setCartCount((c) => c + 1)} />
			<SpecialOffer />
			<Footer />
		</div>
	);
}