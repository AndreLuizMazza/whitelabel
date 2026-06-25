// src/layouts/MemberLayout.jsx
import { Outlet } from 'react-router-dom'
import PrivateRoute from '@/components/PrivateRoute'
import MemberContractGuard from '@/components/MemberContractGuard.jsx'
import AppShell from '@/layouts/AppShell.jsx'

export default function MemberLayout() {
  return (
    <PrivateRoute redirectTo="/login">
      <MemberContractGuard>
        <AppShell>
          <Outlet />
        </AppShell>
      </MemberContractGuard>
    </PrivateRoute>
  )
}
