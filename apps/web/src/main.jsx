import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Checkout from './pages/Checkout.jsx'

const router = createBrowserRouter([
	{ path: '/', element: <App /> },
	{ path: '/admin', element: <Admin /> },
	{ path: '/checkout', element: <Checkout /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
