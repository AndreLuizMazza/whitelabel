// src/layouts/MemberLayout.jsx
import { Outlet } from 'react-router-dom'
import PrivateRoute from '@/components/PrivateRoute'
import AppShell from '@/layouts/AppShell.jsx'

export default function MemberLayout() {
  return (
    <PrivateRoute redirectTo="/login">
      <AppShell>
        <Outlet />
      </AppShell>
    </PrivateRoute>
  )
}
