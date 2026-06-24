import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/employee')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h2 className="page-title">Employee Dashboard</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Hours This Week</span>
          <span className="stat-value">{data.week_hours.toFixed(1)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Hours This Month</span>
          <span className="stat-value">{data.month_hours.toFixed(1)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Assigned Projects</span>
          <span className="stat-value">{data.assigned_projects}</span>
        </div>
      </div>

      <div className="card">
        <h3>Recent Timesheets</h3>
        {data.recent_timesheets.length === 0 ? (
          <p className="empty-state">No timesheets yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Task</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_timesheets.map((t) => (
                <tr key={t.id}>
                  <td>{t.work_date}</td>
                  <td>{t.project_name}</td>
                  <td>{t.hours_logged}</td>
                  <td>{t.task_description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
