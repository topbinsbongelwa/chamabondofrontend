import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getToken } from '../lib/auth'

export function ProtectedRoute() {
  const location = useLocation()

  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
