export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export async function getFeaturedProducts() {
	const res = await fetch(`${API_BASE}/api/products/featured`);
	if (!res.ok) throw new Error('Failed to fetch featured');
	return res.json();
} 