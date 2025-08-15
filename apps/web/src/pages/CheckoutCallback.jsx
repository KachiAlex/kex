import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function CheckoutCallbackPage() {
	const [params] = useSearchParams();
	const [status, setStatus] = useState("verifying");
	const ref = params.get("ref");

	useEffect(() => {
		(async () => {
			try {
				if (!ref) { setStatus("missing"); return; }
				const res = await fetch(`${API_BASE}/api/orders/verify/${encodeURIComponent(ref)}`);
				const data = await res.json();
				setStatus(data?.paid ? "paid" : "failed");
			} catch {
				setStatus("failed");
			}
		})();
	}, [ref]);

	return (
		<div className="min-h-screen bg-white grid place-items-center px-4">
			<div className="max-w-md text-center">
				{status === "verifying" && <h1 className="text-2xl font-semibold">Verifying payment…</h1>}
				{status === "paid" && <h1 className="text-2xl font-semibold text-green-600">Payment successful</h1>}
				{status === "failed" && <h1 className="text-2xl font-semibold text-red-600">Payment failed</h1>}
				{status === "missing" && <h1 className="text-2xl font-semibold">Missing reference</h1>}
				<p className="mt-2 text-gray-600">Ref: {ref || "-"}</p>
			</div>
		</div>
	);
} 