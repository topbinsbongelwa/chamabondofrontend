import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import {
  BookIcon,
  CalendarIcon,
  CheckIcon,
  NotebookIcon,
  TargetIcon,
} from './components/icons'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
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
            <Route
              path="kras"
              element={
                <PlaceholderPage
                  title="KRAs"
                  description="Submit and track your key result areas for each term. This page is coming soon."
                  icon={TargetIcon}
                />
              }
            />
            <Route
              path="scheme-books"
              element={
                <PlaceholderPage
                  title="Scheme Books"
                  description="Prepare and submit your scheme books from your phone. This page is coming soon."
                  icon={BookIcon}
                />
              }
            />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
