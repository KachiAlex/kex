import { useEffect, useState } from "react";
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, DoughnutController, ArcElement, BarController, BarElement } from "chart.js";
import { useNavigate } from "react-router-dom";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, DoughnutController, ArcElement, BarController, BarElement);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function authHeaders() {
	const token = localStorage.getItem("kex_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPage() {
	const [current, setCurrent] = useState("dashboard");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [items, setItems] = useState([]);
	const [orders, setOrders] = useState([]);
	const [stats, setStats] = useState({ totalOrders: 0, paidOrders: 0, totalRevenue: 0 });
	const [form, setForm] = useState({ name: "", price: "", quantity: "", featured: false, category: "", description: "", images: [], videos: [] });
	const [newImageUrl, setNewImageUrl] = useState("");
	const [newVideoUrl, setNewVideoUrl] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [me, setMe] = useState(null);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [profileForm, setProfileForm] = useState({ name: "", phone: "", password: "" });
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState(null);
	const [categories, setCategories] = useState([]);
	const [newCategoryName, setNewCategoryName] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		try {
			const user = JSON.parse(localStorage.getItem("kex_user") || "null");
			const token = localStorage.getItem("kex_token");
			if (!token || user?.role !== 'admin') {
				navigate('/login');
			} else {
				setMe(user);
			}
		} catch {
			navigate('/login');
		}
	}, [navigate]);

	useEffect(() => {
		function onDocClick(e) {
			if (!menuOpen) return;
			if (menuAnchor && !menuAnchor.contains(e.target)) setMenuOpen(false);
		}
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	}, [menuOpen, menuAnchor]);

	async function fetchMe() {
		try {
			const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { ...authHeaders() } });
			if (res.ok) {
				const u = await res.json();
				setMe(u);
			}
		} catch {}
	}

	let charts = {};
	function setupCharts() {
		try {
			const rev = document.getElementById('revenueChart');
			if (rev && !charts.revenue) {
				charts.revenue = new Chart(rev, {
					type: 'line',
					data: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ label: 'Revenue (₦)', data: [2000000,2500000,2200000,2800000,3200000,3500000], borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', tension: 0.4 }] },
					options: { responsive: true, maintainAspectRatio: false }
				});
			}
			const cat = document.getElementById('categoryChart');
			if (cat && !charts.category) {
				charts.category = new Chart(cat, {
					type: 'doughnut',
					data: { labels: ['Smartphones','Laptops','Spy Gadgets','Watches','Accessories'], datasets: [{ data: [35,25,15,15,10], backgroundColor: ['#8b5cf6','#06b6d4','#ef4444','#10b981','#f59e0b'] }] },
					options: { responsive: true, maintainAspectRatio: false }
				});
			}
			const sales = document.getElementById('salesChart');
			if (sales && !charts.sales) {
				charts.sales = new Chart(sales, {
					type: 'bar',
					data: { labels: ['Week 1','Week 2','Week 3','Week 4'], datasets: [{ label: 'Sales', data: [45,52,38,67], backgroundColor: '#8b5cf6' }] },
					options: { responsive: true, maintainAspectRatio: false }
				});
			}
		} catch {}
	}

	useEffect(() => {
		setLoading(true);
		Promise.all([fetchProducts(), fetchOrders(), fetchMe(), fetchCategories()]).finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		if (current === 'dashboard' || current === 'analytics') {
			setTimeout(setupCharts, 0);
		}
	}, [current]);

	async function fetchProducts() {
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/products`);
			const data = await res.json();
			setItems(Array.isArray(data) ? data : []);
		} catch (e) {
			setError("Failed to load products");
		}
	}

	async function fetchOrders() {
		setError("");
		try {
			const [olist, sres] = await Promise.all([
				fetch(`${API_BASE}/api/orders`),
				fetch(`${API_BASE}/api/orders/stats`),
			]);
			const ordersJson = await olist.json();
			const statsJson = await sres.json();
			setOrders(Array.isArray(ordersJson) ? ordersJson : []);
			if (statsJson && typeof statsJson === 'object') setStats(statsJson);
		} catch (e) {
			setError("Failed to load orders/stats");
		}
	}

	async function addProduct(e) {
		e?.preventDefault?.();
		setLoading(true);
		setError("");
		try {
			const payload = {
				name: form.name,
				price: Number(form.price),
				quantity: Number(form.quantity),
				featured: Boolean(form.featured),
				images: Array.isArray(form.images) ? form.images : [],
				videos: Array.isArray(form.videos) ? form.videos : [],
				description: form.description || "",
				category: form.category || "general",
			};
			const res = await fetch(`${API_BASE}/api/products`, {
				method: "POST",
				headers: { "Content-Type": "application/json", ...authHeaders() },
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error("create_failed");
			setForm({ name: "", price: "", quantity: "", featured: false, category: "", description: "", images: [], videos: [] });
			setNewImageUrl("");
			setNewVideoUrl("");
			setShowAddModal(false);
			await fetchProducts();
		} catch (e) {
			setError("Failed to add product");
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
			setError("Failed to update product");
		} finally {
			setLoading(false);
		}
	}

	async function removeProduct(id) {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/products/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
			if (!res.ok && res.status !== 204) throw new Error("delete_failed");
			await fetchProducts();
		} catch (e) {
			setError("Failed to delete product");
		} finally {
			setLoading(false);
		}
	}

	async function saveProfile(e) {
		e?.preventDefault?.();
		setLoading(true);
		setError("");
		try {
			const payload = {
				...(profileForm.name ? { name: profileForm.name } : {}),
				...(profileForm.phone ? { phone: profileForm.phone } : {}),
				...(profileForm.password ? { password: profileForm.password } : {}),
				...(profileForm.avatar ? { avatar: profileForm.avatar } : {}),
			};
			const res = await fetch(`${API_BASE}/api/auth/me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
			if (!res.ok) throw new Error('update_failed');
			const u = await res.json();
			setMe(u);
			localStorage.setItem('kex_user', JSON.stringify(u));
			setShowProfileModal(false);
		} catch (e) {
			setError('Failed to update profile');
		} finally { setLoading(false); }
	}

	function signOut() {
		localStorage.removeItem('kex_token');
		localStorage.removeItem('kex_user');
		navigate('/');
	}

	async function fetchCategories() {
		try {
			const res = await fetch(`${API_BASE}/api/categories`);
			const data = await res.json();
			if (Array.isArray(data)) setCategories(data);
		} catch {}
	}

	async function createCategory() {
		if (!newCategoryName.trim()) return;
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ name: newCategoryName.trim() }) });
			if (!res.ok) throw new Error('create_failed');
			const created = await res.json();
			await fetchCategories();
			setForm(v => ({ ...v, category: created.slug }));
			setNewCategoryName("");
		} catch (e) {
			setError('Failed to create category');
		} finally { setLoading(false); }
	}

	function addImageUrl() {
		if (!newImageUrl.trim()) return;
		setForm(v => ({ ...v, images: [...(v.images||[]), newImageUrl.trim()] }));
		setNewImageUrl("");
	}

	function addVideoUrl() {
		if (!newVideoUrl.trim()) return;
		setForm(v => ({ ...v, videos: [...(v.videos||[]), newVideoUrl.trim()] }));
		setNewVideoUrl("");
	}

	return (
		<div className="bg-gray-100 min-h-screen">
			<div className="flex h-screen">
				{/* Sidebar */}
				<div className="w-64 gradient-bg text-white flex-shrink-0">
					<div className="p-6">
						<div className="flex items-center mb-8">
							<div className="bg-white text-purple-600 px-3 py-2 rounded-lg font-bold text-lg">KEX</div>
							<span className="ml-2 font-semibold">Admin</span>
						</div>
						<nav className="space-y-2">
							{[
								{ id: 'dashboard', label: 'Dashboard', icon: '📊' },
								{ id: 'products', label: 'Products', icon: '📦' },
								{ id: 'orders', label: 'Orders', icon: '🛒' },
								{ id: 'customers', label: 'Customers', icon: '👥' },
								{ id: 'analytics', label: 'Analytics', icon: '📈' },
								{ id: 'transactions', label: 'Transactions', icon: '💳' },
								{ id: 'settings', label: 'Settings', icon: '⚙️' },
							].map((s) => (
								<button
									key={s.id}
									onClick={() => setCurrent(s.id)}
									className={`sidebar-item w-full text-left flex items-center px-4 py-3 rounded-lg ${current===s.id? 'bg-white bg-opacity-20' : ''}`}
								>
									<span className="mr-3">{s.icon}</span>
									{s.label}
								</button>
							))}
						</nav>
					</div>
				</div>

				{/* Main */}
				<div className="flex-1 flex flex-col overflow-hidden">
											<header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
							<div className="flex justify-between items-center">
								<h1 className="text-2xl font-bold text-gray-800">{current.charAt(0).toUpperCase()+current.slice(1)}</h1>
								<div className="flex items-center space-x-4">
									<button className="relative p-2 text-gray-600 hover:text-gray-800">
										<span className="text-xl">🔔</span>
										<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
									</button>
									<div className="flex items-center space-x-3">
										<img src={me?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=64&h=64&q=80"} alt="User" className="w-8 h-8 rounded-full"/>
										<div className="text-right">
											<div className="text-gray-700 font-medium">{me?.name || 'User'}</div>
											<div className="text-xs text-gray-500">{me?.email || ''}</div>
										</div>
										<div ref={setMenuAnchor} className="relative">
											<button onClick={()=>setMenuOpen(v=>!v)} className="px-2 py-1 border rounded-lg text-sm hover:bg-gray-50">⋮</button>
											{menuOpen && (
												<div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-md z-50">
													<button onClick={()=>{ setMenuOpen(false); setProfileForm({ name: me?.name || '', phone: me?.phone || '', password: '', avatar: me?.avatar || '' }); setShowProfileModal(true); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Edit Profile</button>
													<button onClick={()=>{ setMenuOpen(false); signOut(); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Sign Out</button>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						</header>

						<main className="flex-1 overflow-y-auto p-6">
							{current === 'dashboard' && (
								<div className="space-y-8">
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
										<div className="bg-white rounded-xl p-6 shadow-sm card-hover transition-all">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-gray-600 text-sm">Total Revenue</p>
													<p className="text-2xl font-bold text-gray-800">₦{stats.totalRevenue?.toLocaleString?.() ?? 0}</p>
													<p className="text-green-600 text-sm">&nbsp;</p>
												</div>
												<div className="bg-green-100 p-3 rounded-full"><span className="text-2xl">💰</span></div>
											</div>
										</div>
										<div className="bg-white rounded-xl p-6 shadow-sm card-hover transition-all">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-gray-600 text-sm">Total Orders</p>
													<p className="text-2xl font-bold text-gray-800">{stats.totalOrders ?? 0}</p>
													<p className="text-blue-600 text-sm">&nbsp;</p>
												</div>
												<div className="bg-blue-100 p-3 rounded-full"><span className="text-2xl">📦</span></div>
											</div>
										</div>
										<div className="bg-white rounded-xl p-6 shadow-sm card-hover transition-all">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-gray-600 text-sm">Active Products</p>
													<p className="text-2xl font-bold text-gray-800">{items.length}</p>
													<p className="text-purple-600 text-sm">&nbsp;</p>
												</div>
												<div className="bg-purple-100 p-3 rounded-full"><span className="text-2xl">🛍️</span></div>
											</div>
										</div>
										<div className="bg-white rounded-xl p-6 shadow-sm card-hover transition-all">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-gray-600 text-sm">Paid Orders</p>
													<p className="text-2xl font-bold text-gray-800">{stats.paidOrders ?? 0}</p>
													<p className="text-orange-600 text-sm">&nbsp;</p>
												</div>
												<div className="bg-orange-100 p-3 rounded-full"><span className="text-2xl">👥</span></div>
											</div>
										</div>
									</div>

									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
										<div className="bg-white rounded-xl p-6 shadow-sm">
											<h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
											<canvas id="revenueChart" width="400" height="200"></canvas>
										</div>
										<div className="bg-white rounded-xl p-6 shadow-sm">
											<h3 className="text-lg font-semibold mb-4">Top Categories</h3>
											<canvas id="categoryChart" width="400" height="200"></canvas>
										</div>
									</div>

									<div className="bg-white rounded-xl p-6 shadow-sm">
										<h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
										<div className="space-y-4">
											{orders.slice(0,3).map((o,i)=> (
												<div key={o._id} className={`flex items-center justify-between py-3 ${i<2? 'border-b border-gray-100':''}`}>
													<div className="flex items-center">
														<div className="bg-green-100 p-2 rounded-full mr-3">
															<span className="text-green-600">💰</span>
														</div>
														<div>
															<p className="font-medium">New order received</p>
															<p className="text-sm text-gray-600">Order {o.reference} - ₦{o.amount?.toLocaleString?.() ?? o.amount}</p>
														</div>
													</div>
													<span className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleString()}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							{current === 'products' && (
								<div>
									<div className="flex justify-between items-center mb-6">
										<h2 className="text-xl font-semibold">Product Management</h2>
										<button onClick={()=>setShowAddModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all">+ Add New Product</button>
									</div>
									<div className="bg-white rounded-xl shadow-sm overflow-hidden">
										<div className="overflow-x-auto">
											<table className="w-full">
												<thead className="bg-gray-50">
													<tr>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-200">
													{items.map((it)=> (
														<tr key={it._id}>
															<td className="px-6 py-4">
																<div>
																	<p className="font-medium">{it.name}</p>
																	<p className="text-sm text-gray-600">{it.category || 'general'}</p>
																</div>
															</td>
															<td className="px-6 py-4 text-sm font-medium">₦{Number(it.price)?.toLocaleString?.() ?? it.price}</td>
															<td className="px-6 py-4 text-sm text-gray-600">{it.quantity}</td>
															<td className="px-6 py-4">
																<span className={`${it.featured ? 'status-active' : 'status-inactive'} text-white px-2 py-1 rounded-full text-xs`}>{it.featured ? 'Active' : 'Inactive'}</span>
															</td>
															<td className="px-6 py-4 text-sm">
																<button onClick={()=>toggleFeatured(it._id, !it.featured)} className="text-blue-600 hover:text-blue-800 mr-3">{it.featured ? 'Unfeature' : 'Feature'}</button>
																<button onClick={()=>removeProduct(it._id)} className="text-red-600 hover:text-red-800">Delete</button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}

							{current === 'orders' && (
								<div>
									<h2 className="text-xl font-semibold mb-6">Order Management</h2>
									<div className="bg-white rounded-xl shadow-sm overflow-hidden">
										<div className="overflow-x-auto">
											<table className="w-full">
												<thead className="bg-gray-50">
													<tr>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
														<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-200">
													{orders.map(o => (
														<tr key={o._id}>
															<td className="px-6 py-4 font-medium">{o.reference}</td>
															<td className="px-6 py-4 text-sm">{o.customerEmail}</td>
															<td className="px-6 py-4 font-medium">₦{o.amount?.toLocaleString?.() ?? o.amount}</td>
															<td className="px-6 py-4"><span className={`${o.status==='paid' ? 'status-active' : 'status-pending'} text-white px-2 py-1 rounded-full text-xs`}>{o.status}</span></td>
															<td className="px-6 py-4 text-sm text-gray-600">{new Date(o.createdAt).toLocaleString()}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}

							{current === 'customers' && (
								<div>
									<h2 className="text-xl font-semibold mb-6">Customer Management</h2>
									<div className="bg-white rounded-xl p-6 shadow-sm text-sm text-gray-600">Coming soon</div>
								</div>
							)}

							{current === 'analytics' && (
								<div>
									<h2 className="text-xl font-semibold mb-6">Advanced Analytics</h2>
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
										<div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="text-lg font-semibold mb-4">Sales Performance</h3><canvas id="salesChart" width="400" height="200"></canvas></div>
										<div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="text-lg font-semibold mb-4">Customer Growth</h3><canvas id="customerChart" width="400" height="200"></canvas></div>
									</div>
									<div className="bg-white rounded-xl p-6 shadow-sm text-sm text-gray-600">Top products and traffic sources coming soon</div>
								</div>
							)}

							{current === 'transactions' && (
								<div>
									<h2 className="text-xl font-semibold mb-6">Transaction History</h2>
									<div className="bg-white rounded-xl p-6 shadow-sm text-sm text-gray-600">Coming soon</div>
								</div>
							)}

							{current === 'settings' && (
								<div>
									<h2 className="text-xl font-semibold mb-6">Settings</h2>
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
										<div className="bg-white rounded-xl p-6 shadow-sm">
											<h3 className="text-lg font-semibold mb-4">Store Settings</h3>
											<div className="space-y-4 text-sm">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
													<input className="w-full px-3 py-2 border rounded-lg" defaultValue="KEX eCommerce" />
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Store Email</label>
													<input className="w-full px-3 py-2 border rounded-lg" defaultValue="info@kexecommerce.com" />
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
													<select className="w-full px-3 py-2 border rounded-lg">
														<option>Nigerian Naira (₦)</option>
														<option>US Dollar ($)</option>
														<option>Euro (€)</option>
													</select>
												</div>
											</div>
										</div>
										<div className="bg-white rounded-xl p-6 shadow-sm">
											<h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
											<div className="space-y-4 text-sm">
												<div className="flex items-center justify-between"><span className="font-medium">Email Notifications</span><input type="checkbox" defaultChecked /></div>
												<div className="flex items-center justify-between"><span className="font-medium">SMS Notifications</span><input type="checkbox" /></div>
												<div className="flex items-center justify-between"><span className="font-medium">Order Alerts</span><input type="checkbox" defaultChecked /></div>
											</div>
										</div>
									</div>
								</div>
							)}
						</main>
					</div>

				{/* Add Product Modal */}
				{showAddModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
							<div className="flex justify-between items-center mb-6">
								<h3 className="text-xl font-semibold">Add New Product</h3>
								<button onClick={()=>setShowAddModal(false)} className="text-gray-500 hover:text-gray-700"><span className="text-2xl">×</span></button>
							</div>
							<form onSubmit={addProduct} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
										<input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} required className="w-full px-3 py-2 border rounded-lg" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
										<select value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))} className="w-full px-3 py-2 border rounded-lg">
											<option value="">Select Category</option>
											{categories.map(c => (
												<option key={c._id} value={c.slug}>{c.name}</option>
											))}
										</select>
										<div className="mt-2 flex items-center space-x-2">
											<input value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
											<button type="button" onClick={createCategory} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Add</button>
										</div>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
									<textarea rows={4} value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} className="w-full px-3 py-2 border rounded-lg"></textarea>
								</div>
								<div className="space-y-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
										<div className="flex items-center space-x-2 mb-2">
											<input value={newImageUrl} onChange={e=>setNewImageUrl(e.target.value)} placeholder="https://... or data:image/..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
											<button type="button" onClick={addImageUrl} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Add</button>
											<label className="px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">
												Upload
												<input type="file" accept="image/*" className="hidden" onChange={(e)=>{
													const file = e.target.files?.[0]; if (!file) return;
													const reader = new FileReader();
													reader.onload = () => setForm(v=>({...v, images:[...(v.images||[]), String(reader.result||'')]}));
													reader.readAsDataURL(file);
												}} />
											</label>
										</div>
										<div className="grid grid-cols-3 gap-2">
											{(form.images||[]).map((url, idx)=> (
												<div key={idx} className="relative">
													<img src={url} alt="preview" className="w-full h-20 object-cover rounded border" />
													<button type="button" onClick={()=>setForm(v=>({...v, images: v.images.filter((_,i)=>i!==idx)}))} className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs">×</button>
												</div>
											))}
										</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Video (optional)</label>
										<div className="flex items-center space-x-2 mb-2">
											<input value={newVideoUrl} onChange={e=>setNewVideoUrl(e.target.value)} placeholder="https://... or data:video/..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
											<button type="button" onClick={addVideoUrl} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Add</button>
											<label className="px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">
												Upload
												<input type="file" accept="video/*" className="hidden" onChange={(e)=>{
													const file = e.target.files?.[0]; if (!file) return;
													const reader = new FileReader();
													reader.onload = () => setForm(v=>({...v, videos:[...(v.videos||[]), String(reader.result||'')]}));
													reader.readAsDataURL(file);
												}} />
											</label>
										</div>
										{(form.videos||[]).map((url, idx)=> (
											<div key={idx} className="mb-2">
												<video src={url} controls className="w-full h-40 bg-black rounded" />
												<div className="text-right mt-1"><button type="button" onClick={()=>setForm(v=>({...v, videos: v.videos.filter((_,i)=>i!==idx)}))} className="px-2 py-1 text-xs border rounded">Remove</button></div>
											</div>
										))}
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Price (₦)</label>
										<input type="number" required value={form.price} onChange={e=>setForm(v=>({...v,price:e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
										<input type="number" required value={form.quantity} onChange={e=>setForm(v=>({...v,quantity:e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
										<input type="checkbox" checked={form.featured} onChange={e=>setForm(v=>({...v,featured:e.target.checked}))} />
									</div>
								</div>
								<div className="flex justify-end space-x-4">
									<button type="button" onClick={()=>setShowAddModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
									<button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Add Product</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Edit Profile Modal */}
				{showProfileModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-xl p-6 w-full max-w-lg">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-semibold">Edit Profile</h3>
								<button onClick={()=>setShowProfileModal(false)} className="text-gray-500 hover:text-gray-700"><span className="text-2xl">×</span></button>
							</div>
							<form onSubmit={saveProfile} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
									<input value={profileForm.name} onChange={e=>setProfileForm(v=>({...v,name:e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
									<input value={profileForm.phone} onChange={e=>setProfileForm(v=>({...v,phone:e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
									<input value={profileForm.avatar || ''} onChange={e=>setProfileForm(v=>({...v,avatar:e.target.value}))} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg" />
									<div className="mt-2 flex items-center space-x-3">
										<label className="px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">
											Upload image
											<input type="file" accept="image/*" className="hidden" onChange={async (e)=>{
												const file = e.target.files?.[0];
												if (!file) return;
												const reader = new FileReader();
												reader.onload = () => setProfileForm(v=>({...v, avatar: String(reader.result||'')}));
												reader.readAsDataURL(file);
											}} />
										</label>
										{(profileForm.avatar || me?.avatar) && (
											<img src={profileForm.avatar || me?.avatar} alt="Preview" className="w-10 h-10 rounded-full border"/>
										)}
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
									<input type="password" value={profileForm.password} onChange={e=>setProfileForm(v=>({...v,password:e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
								</div>
								<div className="flex justify-end space-x-3">
									<button type="button" onClick={()=>setShowProfileModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
									<button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Save</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}