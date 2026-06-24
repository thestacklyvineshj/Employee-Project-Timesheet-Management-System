import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/manager')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h2 className="page-title">Manager Dashboard</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total Hours (All Time)</span>
          <span className="stat-value">{data.total_hours.toFixed(1)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Hours This Month</span>
          <span className="stat-value">{data.month_hours.toFixed(1)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Projects</span>
          <span className="stat-value">{data.active_projects}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Employees</span>
          <span className="stat-value">{data.total_employees}</span>
        </div>
      </div>

      <div className="card">
        <h3>Top 5 Employees This Month</h3>
        {data.top_employees.length === 0 ? (
          <p className="empty-state">No data yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.top_employees.map((e, i) => (
                <tr key={i}>
                  <td>{e.name}</td>
                  <td>{e.hours.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
