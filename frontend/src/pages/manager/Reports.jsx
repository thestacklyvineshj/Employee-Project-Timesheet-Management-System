import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/manager')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h2 className="page-title">Reports & Analytics</h2>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Hours by Project</h3>
          {data.hours_by_project.length === 0 ? (
            <p className="empty-state">No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.hours_by_project}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(v) => [`${v} hrs`, 'Hours']} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card chart-card">
          <h3>Hours by Employee</h3>
          {data.hours_by_employee.length === 0 ? (
            <p className="empty-state">No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.hours_by_employee}
                  dataKey="hours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, hours }) => `${name}: ${hours.toFixed(1)}h`}
                >
                  {data.hours_by_employee.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} hrs`, 'Hours']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Top 5 Active Employees (This Month)</h3>
        {data.top_employees.length === 0 ? (
          <p className="empty-state">No data available.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Employee</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.top_employees.map((e, i) => (
                <tr key={i}>
                  <td>#{i + 1}</td>
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
