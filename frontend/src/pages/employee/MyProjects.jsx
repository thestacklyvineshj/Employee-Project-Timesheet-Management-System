import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function MyProjects() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/employee-projects')
      .then((res) => setAssignments(res.data.assignments))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading projects...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h2 className="page-title">My Projects</h2>
      <div className="card">
        {assignments.length === 0 ? (
          <p className="empty-state">You are not assigned to any projects yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Assigned On</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.project_name}</td>
                  <td>
                    <span className={`badge badge-${a.project_status}`}>{a.project_status}</span>
                  </td>
                  <td>{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
