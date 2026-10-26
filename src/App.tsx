import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/AdminRoute'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import {
  CalendarIcon,
  ChartBarIcon,
  CheckIcon,
  NotebookIcon,
} from './components/icons'
import { OfflineBanner } from './components/pwa/OfflineBanner'
import { InstallAppButton } from './components/pwa/InstallAppButton'
import { UpdatePrompt } from './components/pwa/UpdatePrompt'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminAnnouncementsPage } from './pages/AdminAnnouncementsPage'
import { AdminStaffPage } from './pages/AdminStaffPage'
import { AccountPage } from './pages/AccountPage'
import { DashboardPage } from './pages/DashboardPage'
import { KrasPage } from './pages/KrasPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SchemeBooksPage } from './pages/SchemeBooksPage'
import { TeacherUpdatesPage } from './pages/TeacherUpdatesPage'
import { SignupPage } from './pages/SignupPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="updates" element={<TeacherUpdatesPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="profile" element={<Navigate to="/updates" replace />} />
            <Route
              path="attendance"
              element={
                <PlaceholderPage
                  title="Attendance"
                  description="Your full attendance history, filters and monthly reports will live here."
                  icon={CheckIcon}
                />
              }
            />
            <Route path="kras" element={<KrasPage />} />
            <Route path="scheme-books" element={<SchemeBooksPage />} />
            <Route
              path="logbook"
              element={
                <PlaceholderPage
                  title="Logbook"
                  description="Keep a daily record of lessons taught and work covered. This page is coming soon."
                  icon={NotebookIcon}
                />
              }
            />
            <Route
              path="calendar"
              element={
                <PlaceholderPage
                  title="Calendar"
                  description="School meetings, deadlines and activities will appear here. This page is coming soon."
                  icon={CalendarIcon}
                />
              }
            />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<DashboardLayout variant="admin" />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
            <Route path="kras" element={<KrasPage />} />
            <Route path="scheme-books" element={<SchemeBooksPage />} />
            <Route
              path="attendance"
              element={
                <PlaceholderPage
                  title="School attendance"
                  description="School-wide attendance records, filters and staff reports will live here."
                  icon={CheckIcon}
                />
              }
            />
            <Route
              path="reports"
              element={
                <PlaceholderPage
                  title="Reports"
                  description="Attendance reports and staff summaries will be available here."
                  icon={ChartBarIcon}
                />
              }
            />
            <Route
              path="calendar"
              element={
                <PlaceholderPage
                  title="School calendar"
                  description="School meetings, deadlines and staff activities will appear here."
                  icon={CalendarIcon}
                />
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <OfflineBanner />
      <InstallAppButton />
      <UpdatePrompt />
    </BrowserRouter>
  )
}
