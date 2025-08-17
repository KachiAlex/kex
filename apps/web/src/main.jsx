import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Checkout from './pages/Checkout.jsx'
import CheckoutCallback from './pages/CheckoutCallback.jsx'
import Login from './pages/Login.jsx'

const router = createBrowserRouter([
	{ path: '/', element: <App /> },
	{ path: '/login', element: <Login /> },
	{ path: '/admin', element: <Admin /> },
	{ path: '/checkout', element: <Checkout /> },
	{ path: '/checkout/callback', element: <CheckoutCallback /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
