import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	async function onSubmit(e) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`${API_BASE}/api/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password })
			});
			const data = await res.json();
			if (!res.ok || !data?.token) throw new Error(data?.error || "login_failed");
			localStorage.setItem("kex_token", data.token);
			localStorage.setItem("kex_user", JSON.stringify(data.user));
			navigate("/admin");
		} catch (e) {
			setError("Invalid credentials");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="mx-auto max-w-sm px-4 py-10">
				<h1 className="text-2xl font-semibold">Sign in</h1>
				<p className="text-sm text-gray-600">Admin access requires a valid account.</p>
				<form onSubmit={onSubmit} className="mt-6 space-y-4">
					<input type="email" required className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
					<div className="relative">
						<input type={showPassword ? "text" : "password"} required className="w-full border rounded px-3 py-2 pr-12" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
						<button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-2 my-auto text-sm text-gray-600 hover:text-black">{showPassword ? 'Hide' : 'Show'}</button>
					</div>
					<button disabled={loading} className="rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90 transition w-full">Sign in</button>
					{error && <div className="text-sm text-red-600">{error}</div>}
				</form>
				<div className="mt-4 text-sm text-gray-700">
					Don't have an account? <Link className="text-purple-600 hover:underline" to="/signup">Sign up</Link>
				</div>
			</div>
		</div>
	);
} 