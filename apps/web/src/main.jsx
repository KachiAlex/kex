import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

import Checkout from './pages/Checkout.jsx'
import CheckoutCallback from './pages/CheckoutCallback.jsx'
import Login from './pages/Login.jsx'

function RequireAdmin({ children }) {
	try {
		const user = JSON.parse(localStorage.getItem('kex_user') || 'null');
		const token = localStorage.getItem('kex_token');
		if (!token || user?.role !== 'admin') {
			return <Navigate to="/login" replace />;
		}
		return children;
	} catch {
		return <Navigate to="/login" replace />;
	}
}

const router = createBrowserRouter([
	{ path: '/', element: <App /> },
	{ path: '/login', element: <Login /> },
	{ path: '/admin', element: (
		<RequireAdmin>
			<Admin />
		</RequireAdmin>
	) },
	{ path: '/checkout', element: <Checkout /> },
	{ path: '/checkout/callback', element: <CheckoutCallback /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
