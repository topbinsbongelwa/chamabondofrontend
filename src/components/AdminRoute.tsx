import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getToken } from '../lib/auth'
import { getRole, isAdminRole } from '../lib/roles'
import { NotAllowedPage } from './NotAllowedPage'

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
    return <NotAllowedPage description="The administration dashboard is available to teachers in charge, deputy heads and the head only." />
  }

  return <Outlet />
}
