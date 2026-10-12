import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { UpdateBanner } from './core/ui'
import { AuthProvider, LoginPage, RequireAuth } from './core'
import { HomePage } from './home/HomePage'
import { modules } from './home/modules'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [{ index: true, element: <HomePage /> }, ...modules.map((m) => m.route)],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <UpdateBanner />
      </AuthProvider>
    </QueryClientProvider>
  )
}
