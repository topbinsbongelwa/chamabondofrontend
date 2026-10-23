import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getToken } from '../lib/auth'
import { getRole, isAdminRole } from '../lib/roles'

export function AdminRoute() {
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

  if (!isAdminRole(getRole())) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
