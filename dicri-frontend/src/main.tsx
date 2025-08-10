import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { App } from './App'
import { LoginPage } from './pages/Login'
import { ResetPasswordPage } from './pages/ResetPassword'
import { ResetRequestPage } from './pages/ResetRequest'
import { DashboardPage } from './pages/Dashboard'
import { UsersListPage } from './pages/users/UsersList'
import { UserDetailPage } from './pages/users/UserDetail'
import { UserCreatePage } from './pages/users/UserCreate'
import { UserEditPage } from './pages/users/UserEdit'
import { UserPasswordPage } from './pages/users/UserPassword'
import { CatalogsPage } from './pages/catalogs/CatalogsPage'
import { ExpedientesListPage } from './pages/expedientes/ExpedientesList'
import { ExpedienteCreatePage } from './pages/expedientes/ExpedienteCreate'
import { ExpedienteDetailPage } from './pages/expedientes/ExpedienteDetail'
import { ReportesPage } from './pages/Reportes'
import { Protected } from './routes/Protected'
import { MainLayout } from './routes/MainLayout'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/reset', element: <ResetPasswordPage /> },
  { path: '/reset/request', element: <ResetRequestPage /> },
  {
    path: '/',
    element: (
      <Protected>
        <MainLayout />
      </Protected>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
  { path: 'users', element: <UsersListPage /> },
  { path: 'users/create', element: <UserCreatePage /> },
  { path: 'users/:id', element: <UserDetailPage /> },
  { path: 'users/:id/edit', element: <UserEditPage /> },
  { path: 'users/:id/password', element: <UserPasswordPage /> },
  { path: 'catalogos', element: <CatalogsPage /> },
  { path: 'expedientes', element: <ExpedientesListPage /> },
  { path: 'expedientes/create', element: <ExpedienteCreatePage /> },
  { path: 'expedientes/:id', element: <ExpedienteDetailPage /> },
  { path: 'reportes', element: <ReportesPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
