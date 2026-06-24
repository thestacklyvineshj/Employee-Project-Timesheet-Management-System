import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const employeeLinks = [
  { to: '/employee', label: 'Dashboard', end: true },
  { to: '/employee/projects', label: 'My Projects' },
  { to: '/employee/submit', label: 'Submit Timesheet' },
  { to: '/employee/history', label: 'Timesheet History' },
];

const managerLinks = [
  { to: '/manager', label: 'Dashboard', end: true },
  { to: '/manager/projects', label: 'Projects' },
  { to: '/manager/assignments', label: 'Assignments' },
  { to: '/manager/timesheets', label: 'Timesheets' },
  { to: '/manager/reports', label: 'Reports' },
];

export default function Layout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = role === 'manager' ? managerLinks : employeeLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Employee Project & Timesheet Management System</h1>
          <span className="role-badge">{role}</span>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span className="user-greeting">Welcome, {user?.name}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
