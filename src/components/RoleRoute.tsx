import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getToken } from '../lib/auth'
import { getRole, type UserRole } from '../lib/roles'
import { NotAllowedPage } from './NotAllowedPage'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
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

  if (!allowedRoles.includes(getRole())) {
    return <NotAllowedPage description="This page is restricted to the head of school." />
  }

  return <Outlet />
}
