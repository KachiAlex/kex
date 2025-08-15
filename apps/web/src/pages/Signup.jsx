import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	async function onSubmit(e) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/auth/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password })
			});
			const data = await res.json();
			if (!res.ok || !data?.token) throw new Error(data?.error || "signup_failed");
			localStorage.setItem("kex_token", data.token);
			localStorage.setItem("kex_user", JSON.stringify(data.user));
			navigate("/admin");
		} catch (e) {
			setError("Signup failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="mx-auto max-w-sm px-4 py-10">
				<h1 className="text-2xl font-semibold">Create account</h1>
				<p className="text-sm text-gray-600">Use an email and password to get started.</p>
				<form onSubmit={onSubmit} className="mt-6 space-y-4">
					<input required className="w-full border rounded px-3 py-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
					<input type="email" required className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
					<input type="password" required className="w-full border rounded px-3 py-2" placeholder="Password (min 6)" value={password} onChange={(e)=>setPassword(e.target.value)} />
					<button disabled={loading} className="rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90 transition w-full">Sign up</button>
					{error && <div className="text-sm text-red-600">{error}</div>}
				</form>
			</div>
		</div>
	);
} 