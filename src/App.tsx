import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ErrorScreen, PullToRefresh, StatusBanners, UpdateBanner } from './core/ui'
import { AuthProvider, notify, LoginPage, RequireAuth } from './core'
import { HomePage } from './home/HomePage'
import { modules } from './home/modules'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: () => notify('Action impossible pour l’instant. Vérifie ta connexion et réessaie.'),
  }),
})

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <ErrorScreen /> },
  {
    element: <RequireAuth />,
    errorElement: <ErrorScreen />,
    children: [{ index: true, element: <HomePage /> }, ...modules.map((m) => m.route)],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <UpdateBanner />
        <StatusBanners />
        <PullToRefresh />
      </AuthProvider>
    </QueryClientProvider>
  )
}
