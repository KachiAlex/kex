import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function Dashboard() {
	const [email, setEmail] = useState("");
	const [stats, setStats] = useState({ totalOrders: 0, paidOrders: 0, totalRevenue: 0 });
	const [frequent, setFrequent] = useState([]);
	const [orders, setOrders] = useState([]);
	const [notifications, setNotifications] = useState([]);
	const [ticket, setTicket] = useState({ subject: "", message: "" });
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		try {
			const u = JSON.parse(localStorage.getItem("kex_user") || "{}");
			if (u?.email) setEmail(u.email);
		} catch {}
	}, []);

	useEffect(() => {
		if (!email) return;
		(async () => {
			try {
				const [s, f, o, n] = await Promise.all([
					fetch(`${API_BASE}/api/orders/stats?email=${encodeURIComponent(email)}`).then(r=>r.json()),
					fetch(`${API_BASE}/api/orders/frequent?email=${encodeURIComponent(email)}&limit=5`).then(r=>r.json()),
					fetch(`${API_BASE}/api/orders?email=${encodeURIComponent(email)}`).then(r=>r.json()),
					fetch(`${API_BASE}/api/notifications?email=${encodeURIComponent(email)}`).then(r=>r.json()),
				]);
				setStats(s || { totalOrders: 0, paidOrders: 0, totalRevenue: 0 });
				setFrequent(Array.isArray(f) ? f : []);
				setOrders(Array.isArray(o) ? o : []);
				setNotifications(Array.isArray(n) ? n : []);
			} catch (e) {
				setError("Failed to load dashboard data");
			}
		})();
	}, [email]);

	async function createTicket(e) {
		e.preventDefault();
		if (!email) return;
		setSubmitting(true);
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/tickets`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, subject: ticket.subject, message: ticket.message })
			});
			if (!res.ok) throw new Error();
			setTicket({ subject: "", message: "" });
			// refresh tickets list
			const list = await fetch(`${API_BASE}/api/tickets?email=${encodeURIComponent(email)}`).then(r=>r.json());
			// we can render tickets below if needed; for now, ignore or add minimal state
		} catch (e) {
			setError("Failed to create ticket");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="mx-auto max-w-6xl px-4 py-6">
				<h1 className="text-2xl font-semibold">Your Dashboard</h1>
				<p className="text-sm text-gray-600">Overview of your orders and activity</p>

				{error && <div className="mt-4 text-sm text-red-600">{error}</div>}

				<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="rounded-xl bg-gray-50 p-4 border"><div className="text-sm text-gray-600">Total revenue</div><div className="text-2xl font-semibold">₦{stats.totalRevenue?.toLocaleString?.() ?? 0}</div></div>
					<div className="rounded-xl bg-gray-50 p-4 border"><div className="text-sm text-gray-600">Paid orders</div><div className="text-2xl font-semibold">{stats.paidOrders ?? 0}</div></div>
					<div className="rounded-xl bg-gray-50 p-4 border"><div className="text-sm text-gray-600">All orders</div><div className="text-2xl font-semibold">{stats.totalOrders ?? 0}</div></div>
				</div>

				<div className="mt-8">
					<h2 className="text-lg font-semibold">Frequently purchased</h2>
					<ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
						{frequent.map((p) => (
							<li key={(p.productId||p.name)} className="border rounded p-3 flex items-center justify-between">
								<div>
									<div className="font-medium">{p.name}</div>
									<div className="text-sm text-gray-600">Qty: {p.quantity}</div>
								</div>
								<div className="text-sm">₦{p.amount?.toLocaleString?.() ?? p.amount}</div>
							</li>
						))}
					</ul>
				</div>

				<div className="mt-8">
					<h2 className="text-lg font-semibold">Recent orders</h2>
					<div className="mt-3 overflow-x-auto">
						<table className="min-w-full border text-sm">
							<thead className="bg-gray-50">
								<tr>
									<th className="p-2 border">Reference</th>
									<th className="p-2 border">Amount</th>
									<th className="p-2 border">Status</th>
									<th className="p-2 border">Date</th>
								</tr>
							</thead>
							<tbody>
								{orders.map((o) => (
									<tr key={o._id}>
										<td className="p-2 border">{o.reference}</td>
										<td className="p-2 border">₦{o.amount?.toLocaleString?.() ?? o.amount}</td>
										<td className="p-2 border">{o.status}</td>
										<td className="p-2 border">{new Date(o.createdAt).toLocaleString()}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h2 className="text-lg font-semibold">Create support ticket</h2>
						<form onSubmit={createTicket} className="mt-3 space-y-3">
							<input className="w-full border rounded px-3 py-2" placeholder="Subject" value={ticket.subject} onChange={(e)=>setTicket(t=>({...t, subject:e.target.value}))} required />
							<textarea className="w-full border rounded px-3 py-2" placeholder="Describe your issue" rows={4} value={ticket.message} onChange={(e)=>setTicket(t=>({...t, message:e.target.value}))} required />
							<button disabled={submitting} className="rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90 transition">Submit</button>
						</form>
					</div>
					<div>
						<h2 className="text-lg font-semibold">Notifications</h2>
						<ul className="mt-3 space-y-2">
							{notifications.length === 0 && <li className="text-sm text-gray-600">No notifications</li>}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
} 