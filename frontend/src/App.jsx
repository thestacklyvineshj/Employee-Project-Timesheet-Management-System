import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmployeeDashboard from './pages/employee/Dashboard';
import MyProjects from './pages/employee/MyProjects';
import SubmitTimesheet from './pages/employee/SubmitTimesheet';
import TimesheetHistory from './pages/employee/TimesheetHistory';
import ManagerDashboard from './pages/manager/Dashboard';
import ProjectManagement from './pages/manager/ProjectManagement';
import EmployeeAssignment from './pages/manager/EmployeeAssignment';
import TimesheetMonitoring from './pages/manager/TimesheetMonitoring';
import Reports from './pages/manager/Reports';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'manager' ? '/manager' : '/employee'} replace />;
  }

  return children;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'manager' ? '/manager' : '/employee'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'manager' ? '/manager' : '/employee'} /> : <Register />} />

      <Route
        path="/employee"
        element={
          <ProtectedRoute role="employee">
            <Layout role="employee" />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
        <Route path="projects" element={<MyProjects />} />
        <Route path="submit" element={<SubmitTimesheet />} />
        <Route path="history" element={<TimesheetHistory />} />
      </Route>

      <Route
        path="/manager"
        element={
          <ProtectedRoute role="manager">
            <Layout role="manager" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboard />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="assignments" element={<EmployeeAssignment />} />
        <Route path="timesheets" element={<TimesheetMonitoring />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? (user.role === 'manager' ? '/manager' : '/employee') : '/login'} replace />} />
    </Routes>
  );
}

export default App;
