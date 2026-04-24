import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useDataStore } from './store/dataStore';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './components/Layout';
// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import Students from './pages/admin/Students';
import Financials from './pages/admin/Financials';
import StaffManagement from './pages/admin/StaffManagement';
import AcademicSetup from './pages/admin/AcademicSetup';
import AuditLogs from './pages/admin/AuditLogs';
import SubjectAssignment from './pages/admin/SubjectAssignment';
import FeeStructures from './pages/admin/FeeStructures';
// Staff
import StaffDashboard from './pages/staff/StaffDashboard';
import Grading from './pages/staff/Grading';
import Attendance from './pages/staff/Attendance';
import ReportCards from './pages/staff/ReportCards';
// Student
import StudentDashboard from './pages/student/StudentDashboard';
import MyGrades from './pages/student/MyGrades';
import Leaderboard from './pages/student/Leaderboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentProfile from './pages/student/StudentProfile';
import MyReportCard from './pages/student/MyReportCard';
// Parent
import ParentDashboard from './pages/parent/ParentDashboard';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RoleRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'admin':   return <Navigate to="/admin" replace />;
    case 'staff':   return <Navigate to="/staff" replace />;
    case 'student': return <Navigate to="/student" replace />;
    case 'parent':  return <Navigate to="/parent" replace />;
    default:        return <Navigate to="/login" replace />;
  }
}

export default function App() {
  const fetchFromBackend = useDataStore(s => s.fetchFromBackend);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFromBackend();
    }
  }, [isAuthenticated, fetchFromBackend]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<PrivateRoute><HomeRedirect /></PrivateRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<PrivateRoute><RoleRoute role="admin"><Layout /></RoleRoute></PrivateRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="students"   element={<Students />} />
          <Route path="staff"      element={<StaffManagement />} />
          <Route path="financials" element={<Financials />} />
          <Route path="academic"   element={<AcademicSetup />} />
          <Route path="subjects"   element={<SubjectAssignment />} />
          <Route path="fees"       element={<FeeStructures />} />
          <Route path="audit"      element={<AuditLogs />} />
        </Route>

        {/* Staff routes */}
        <Route path="/staff" element={<PrivateRoute><RoleRoute role="staff"><Layout /></RoleRoute></PrivateRoute>}>
          <Route index element={<StaffDashboard />} />
          <Route path="grading"     element={<Grading />} />
          <Route path="attendance"  element={<Attendance />} />
          <Route path="reportcards" element={<ReportCards />} />
        </Route>

        {/* Student routes */}
        <Route path="/student" element={<PrivateRoute><RoleRoute role="student"><Layout /></RoleRoute></PrivateRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="grades"      element={<MyGrades />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="attendance"  element={<StudentAttendance />} />
          <Route path="profile"     element={<StudentProfile />} />
          <Route path="reportcard"  element={<MyReportCard />} />
        </Route>

        {/* Parent routes */}
        <Route path="/parent" element={<PrivateRoute><RoleRoute role="parent"><Layout /></RoleRoute></PrivateRoute>}>
          <Route index element={<ParentDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
