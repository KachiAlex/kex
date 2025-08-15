import { useEffect, useMemo, useState } from "react";
import { isAuthenticated, signOut } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function authHeaders() {
	const token = localStorage.getItem("kex_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [items, setItems] = useState([]);
	const [form, setForm] = useState({ name: "", price: "", quantity: "", featured: false });
	const navigate = useNavigate();

	useEffect(() => {
		if (!isAuthenticated()) {
			navigate("/login");
			return;
		}
	}, [navigate]);

	async function fetchProducts() {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/products`);
			const data = await res.json();
			setItems(Array.isArray(data) ? data : []);
		} catch (e) {
			setError("Failed to load products");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchProducts();
	}, []);

	async function addProduct(e) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const payload = {
				name: form.name,
				price: Number(form.price),
				quantity: Number(form.quantity),
				featured: Boolean(form.featured),
				images: [],
				description: "",
				category: "general",
			};
			const res = await fetch(`${API_BASE}/api/products`, {
				method: "POST",
				headers: { "Content-Type": "application/json", ...authHeaders() },
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error("create_failed");
			setForm({ name: "", price: "", quantity: "", featured: false });
			await fetchProducts();
		} catch (e) {
			setError("Failed to add product (auth?)");
		} finally {
			setLoading(false);
		}
	}

	async function toggleFeatured(id, featured) {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/products/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json", ...authHeaders() },
				body: JSON.stringify({ featured })
			});
			if (!res.ok) throw new Error("update_failed");
			await fetchProducts();
		} catch (e) {
			setError("Failed to update product (auth?)");
		} finally {
			setLoading(false);
		}
	}

	async function removeProduct(id) {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/products/${id}`, {
				method: "DELETE",
				headers: { ...authHeaders() }
			});
			if (!res.ok && res.status !== 204) throw new Error("delete_failed");
			await fetchProducts();
		} catch (e) {
			setError("Failed to delete product (auth?)");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="mx-auto max-w-6xl px-4 py-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-semibold">Admin • Products</h1>
					<button onClick={()=>{signOut(); navigate('/login');}} className="text-sm text-red-600">Sign out</button>
				</div>
				<p className="text-sm text-gray-600">Use the form to add products. Toggle featured and manage inventory.</p>

				<form onSubmit={addProduct} className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
					<input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={(e)=>setForm(v=>({...v, name:e.target.value}))} required />
					<input type="number" step="0.01" className="border rounded px-3 py-2" placeholder="Price" value={form.price} onChange={(e)=>setForm(v=>({...v, price:e.target.value}))} required />
					<input type="number" className="border rounded px-3 py-2" placeholder="Quantity" value={form.quantity} onChange={(e)=>setForm(v=>({...v, quantity:e.target.value}))} required />
					<label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e)=>setForm(v=>({...v, featured:e.target.checked}))} /> Featured</label>
					<button disabled={loading} className="rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90 transition">Add</button>
				</form>

				{error && <div className="mt-4 text-red-600 text-sm">{error}</div>}

				<div className="mt-6 overflow-x-auto">
					<table className="min-w-full border text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="p-2 border">Name</th>
								<th className="p-2 border">Price</th>
								<th className="p-2 border">Qty</th>
								<th className="p-2 border">Featured</th>
								<th className="p-2 border">Actions</th>
							</tr>
						</thead>
						<tbody>
							{items.map((it)=> (
								<tr key={it._id}>
									<td className="p-2 border">{it.name}</td>
									<td className="p-2 border">${it.price?.toFixed?.(2) ?? it.price}</td>
									<td className="p-2 border">{it.quantity}</td>
									<td className="p-2 border">
										<button onClick={()=>toggleFeatured(it._id, !it.featured)} className="rounded border px-2 py-1 hover:bg-black hover:text-white transition">{it.featured ? 'Yes' : 'No'}</button>
									</td>
									<td className="p-2 border">
										<button onClick={()=>removeProduct(it._id)} className="rounded border px-2 py-1 text-red-600 hover:bg-red-600 hover:text-white transition">Delete</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
} 