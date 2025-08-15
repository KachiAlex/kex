import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./index.css";
import { getFeaturedProducts } from "./lib/api";

const sampleProducts = [
	{ id: "sw-1", name: "KEX Smartwatch X1", price: 149.0, image: "https://images.unsplash.com/photo-1518441902110-2370cdd502db?q=80&w=800&auto=format&fit=crop", tag: "Bestseller" },
	{ id: "lt-1", name: "Aura Ambient Light", price: 39.0, image: "https://images.unsplash.com/photo-1510951363682-1b5e8694c3e0?q=80&w=800&auto=format&fit=crop", tag: "New" },
	{ id: "gd-1", name: "Smart Home Hub Mini", price: 89.0, image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop", tag: "Hot" },
	{ id: "sp-1", name: "Stealth Cam Glasses", price: 129.0, image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=800&auto=format&fit=crop", tag: "Trending" },
	{ id: "gf-1", name: "KEX Gift Card $50", price: 50.0, image: "https://images.unsplash.com/photo-1603566234499-76f301cb3318?q=80&w=800&auto=format&fit=crop", tag: "Gift" },
	{ id: "sw-2", name: "KEX Smartwatch S Pro", price: 199.0, image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop", tag: "Premium" }
];

function Header() {
	return (
		<header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-black/5">
			<div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="h-8 w-8 rounded-md bg-kex-secondary grid place-items-center text-kex-primary font-bold">K</div>
					<div className="font-semibold">KEX</div>
				</div>
				<nav className="hidden md:flex items-center gap-6 text-sm">
					<a className="hover:text-kex-secondary" href="#">Home</a>
					<a className="hover:text-kex-secondary" href="#">Smartwatches</a>
					<a className="hover:text-kex-secondary" href="#">Lights</a>
					<a className="hover:text-kex-secondary" href="#">Gadgets</a>
					<a className="hover:text-kex-secondary" href="#">Gifts</a>
				</nav>
				<div className="flex items-center gap-3">
					<button className="rounded-md border px-3 py-1.5 text-sm hover:bg-black hover:text-white transition">Sign in</button>
					<button className="rounded-md bg-kex-secondary text-kex-primary px-3 py-1.5 text-sm hover:opacity-90 transition">Cart (0)</button>
				</div>
			</div>
		</header>
	);
}

function Hero() {
	return (
		<section className="mx-auto max-w-7xl px-4 pt-6 md:pt-10">
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E1E1E] to-[#2a2a2a]">
				<div className="grid md:grid-cols-2">
					<div className="p-8 md:p-12 text-white">
						<h1 className="text-3xl md:text-4xl font-semibold">Smart. Stylish. Yours.</h1>
						<p className="mt-3 text-white/80">Discover premium smartwatches, ambient lights, innovative gadgets, and gifts. Designed for modern life.</p>
						<div className="mt-6 flex gap-3">
							<a href="#products" className="button-primary">Shop now</a>
							<a href="#" className="rounded-md border border-white/20 px-4 py-2 text-white hover:bg-white hover:text-black transition">Browse categories</a>
						</div>
					</div>
					<motion.img initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1.2 }} src="https://images.unsplash.com/photo-1518441902110-2370cdd502db?q=80&w=1000&auto=format&fit=crop" alt="Hero product" className="h-full w-full object-cover" />
				</div>
			</motion.div>
		</section>
	);
}

function ProductCard({ product }) {
	const image = product?.images?.[0] || product.image;
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4 }}
			className="group rounded-xl border border-black/5 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
		>
			<div className="relative aspect-square overflow-hidden">
				<motion.img whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }} src={image} alt={product.name} className="h-full w-full object-cover" />
				{(product.tag || product.featured) && (
					<span className="absolute left-2 top-2 rounded bg-kex-secondary/90 px-2 py-1 text-xs font-medium text-kex-primary">{product.tag || 'Featured'}</span>
				)}
			</div>
			<div className="p-3">
				<div className="flex items-start justify-between gap-2">
					<h3 className="text-sm font-medium text-black">{product.name}</h3>
					<div className="text-sm font-semibold text-kex-primary">${Number(product.price).toFixed(2)}</div>
				</div>
				<div className="mt-3 flex gap-2">
					<button className="flex-1 rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90 transition">Add to cart</button>
					<button className="rounded-md border px-3 py-2 text-sm hover:bg-black hover:text-white transition" aria-label="Wishlist">♡</button>
				</div>
			</div>
		</motion.div>
	);
}

function ProductGrid() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [products, setProducts] = useState(sampleProducts);

	useEffect(() => {
		(async () => {
			try {
				const data = await getFeaturedProducts();
				if (Array.isArray(data) && data.length > 0) {
					setProducts(data);
				}
			} catch {
				setError("Showing placeholder products. Connect API to load live data.");
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return (
		<section id="products" className="mx-auto max-w-7xl px-4 py-8 md:py-12">
			<div className="flex items-center justify-between">
				<h2 className="text-xl md:text-2xl font-semibold">Featured products</h2>
				<a href="#" className="text-sm hover:text-kex-secondary">View all</a>
			</div>
			{error && <div className="mt-2 text-xs text-gray-500">{error}</div>}
			<div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
				{products.map((p) => (
					<ProductCard key={p._id || p.id} product={p} />
				))}
			</div>
		</section>
	);
}

export default function App() {
	return (
		<div className="min-h-screen bg-white">
			<Header />
			<Hero />
			<ProductGrid />
		</div>
	);
}