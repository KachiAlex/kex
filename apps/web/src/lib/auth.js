export function getToken() {
	return localStorage.getItem("kex_token") || "";
}

export function getUser() {
	try { return JSON.parse(localStorage.getItem("kex_user") || "null"); } catch { return null; }
}

export function isAuthenticated() {
	return Boolean(getToken());
}

export function signOut() {
	localStorage.removeItem("kex_token");
	localStorage.removeItem("kex_user");
} 