import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
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
			const res = await fetch(`${API_BASE}/api/auth/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, phone, password })
			});
			const data = await res.json();
			if (!res.ok || !data?.token) throw new Error(data?.error || "signup_failed");
			localStorage.setItem("kex_token", data.token);
			localStorage.setItem("kex_user", JSON.stringify(data.user));
			navigate("/");
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
				<p className="text-sm text-gray-600">Use email, phone and password to get started.</p>
				<form onSubmit={onSubmit} className="mt-6 space-y-4">
					<input required className="w-full border rounded px-3 py-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
					<input type="email" required className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
					<input required className="w-full border rounded px-3 py-2" placeholder="Phone number" value={phone} onChange={(e)=>setPhone(e.target.value)} />
					<div className="relative">
						<input type={showPassword ? "text" : "password"} required className="w-full border rounded px-3 py-2 pr-12" placeholder="Password (min 6)" value={password} onChange={(e)=>setPassword(e.target.value)} />
						<button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-2 my-auto text-sm text-gray-600 hover:text-black">{showPassword ? 'Hide' : 'Show'}</button>
					</div>
					<button disabled={loading} className="rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90 transition w-full">Sign up</button>
					{error && <div className="text-sm text-red-600">{error}</div>}
				</form>
				<div className="mt-4 text-sm text-gray-700">
					Already have an account? <Link className="text-purple-600 hover:underline" to="/login">Sign in</Link>
				</div>
			</div>
		</div>
	);
} 