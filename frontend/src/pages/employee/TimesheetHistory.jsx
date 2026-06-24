import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function TimesheetHistory() {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ project_id: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTimesheets = (params = filters) => {
    setLoading(true);
    const query = new URLSearchParams();
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);

    api.get(`/timesheets/my?${query.toString()}`)
      .then((res) => setTimesheets(res.data.timesheets))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load timesheets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/employee-projects').then((res) => setProjects(res.data.assignments));
    loadTimesheets();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadTimesheets(filters);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timesheet entry?')) return;
    try {
      await api.delete(`/timesheets/${id}`);
      loadTimesheets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <h2 className="page-title">Timesheet History</h2>

      <div className="card filter-bar">
        <form onSubmit={handleFilter} className="filter-form">
          <div className="form-group">
            <label>Project</label>
            <select value={filters.project_id} onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}>
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>From</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="form-group">
            <label>To</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary">Filter</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : timesheets.length === 0 ? (
          <p className="empty-state">No timesheets found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Task</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((t) => (
                <tr key={t.id}>
                  <td>{t.work_date}</td>
                  <td>{t.project_name}</td>
                  <td>{t.hours_logged}</td>
                  <td>{t.task_description}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
