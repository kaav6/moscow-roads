import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/shared/auth';
import { RealtimeBridge } from '@/shared/realtime';
import { DEMO_MODE } from '@/shared/demo';
import LoginPage from '@/pages/login';
import OperatorPage from '@/pages/operator';
import AnalyticsPage from '@/pages/analytics';
import { AppShell } from '@/widgets/AppShell';
import './styles/index.css';

const savedTheme = localStorage.getItem('tp_theme');
if (savedTheme === 'dark' || savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});

function Protected({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const routes = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <Protected>
        <RealtimeBridge />
        <AppShell />
      </Protected>
    ),
    children: [
      { index: true, element: <OperatorPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];

const router = DEMO_MODE ? createHashRouter(routes) : createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
